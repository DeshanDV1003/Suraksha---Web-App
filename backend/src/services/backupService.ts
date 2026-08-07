import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// ── Config ────────────────────────────────────────────────────────────────────
const BACKUP_DIR = 'D:\\SurakshaBackups';
const KEEP_DAYS  = 7; // auto-delete backups older than this

// Common PostgreSQL install locations on Windows
const PG_DUMP_CANDIDATES = [
  'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe',
  'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
  'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
  'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\17\\bin\\pg_dump.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\16\\bin\\pg_dump.exe',
  'D:\\PostgreSQL\\17\\bin\\pg_dump.exe',
  'D:\\PostgreSQL\\16\\bin\\pg_dump.exe',
];

function findPgDump(): string | null {
  for (const p of PG_DUMP_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function parseDatabaseUrl(url: string) {
  // postgresql://user:password@host:port/dbname?schema=...
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) throw new Error('Cannot parse DATABASE_URL: ' + url);
  return { user: match[1], password: match[2], host: match[3], port: match[4], db: match[5] };
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`[Backup] Created backup directory: ${BACKUP_DIR}`);
  }
}

function timestamp(): string {
  const now = new Date();
  const y  = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d  = String(now.getDate()).padStart(2, '0');
  const h  = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${d}_${h}${mi}`;
}

function deleteOldBackups() {
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  const files  = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('suraksha_') && f.endsWith('.sql'));
  let deleted  = 0;
  for (const file of files) {
    const full  = path.join(BACKUP_DIR, file);
    const mtime = fs.statSync(full).mtimeMs;
    if (mtime < cutoff) { fs.unlinkSync(full); deleted++; }
  }
  if (deleted > 0) console.log(`[Backup] Deleted ${deleted} old backup(s) (>${KEEP_DAYS} days)`);
}

export async function runBackup(): Promise<void> {
  ensureBackupDir();

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL not set in environment');

  const { user, password, host, port, db } = parseDatabaseUrl(dbUrl);
  const file = path.join(BACKUP_DIR, `suraksha_${timestamp()}.sql`);

  const pgDump = findPgDump();

  if (pgDump) {
    // ── Method 1: pg_dump binary (fastest, full fidelity) ─────────────────
    console.log(`[Backup] Using pg_dump at: ${pgDump}`);
    const cmd = `"${pgDump}" -U ${user} -h ${host} -p ${port} -d ${db} -f "${file}" --no-password`;
    const env = { ...process.env, PGPASSWORD: password };

    await execAsync(cmd, { env });
    const size = (fs.statSync(file).size / 1024).toFixed(1);
    console.log(`[Backup] ✓ Backup saved to ${file} (${size} KB)`);

  } else {
    // ── Method 2: Pure-Node pg dump (works without pg_dump installed) ──────
    console.log('[Backup] pg_dump not found — using Node.js pg fallback');
    const { Client } = await import('pg');
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    const tables = await client.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );

    const lines: string[] = [
      `-- Suraksha DB Backup`,
      `-- Created: ${new Date().toISOString()}`,
      `-- Method: Node.js pg fallback (pg_dump not available)`,
      `SET client_encoding = 'UTF8';`,
      `SET standard_conforming_strings = on;`,
      '',
    ];

    for (const { tablename } of tables.rows) {
      try {
        const rows = await client.query(`SELECT * FROM "${tablename}"`);
        if (rows.rows.length === 0) continue;

        lines.push(`-- Table: ${tablename}`);
        lines.push(`TRUNCATE TABLE "${tablename}" CASCADE;`);

        for (const row of rows.rows) {
          const cols   = Object.keys(row).map(c => `"${c}"`).join(', ');
          const vals   = Object.values(row).map(v => {
            if (v === null) return 'NULL';
            if (typeof v === 'number' || typeof v === 'boolean') return String(v);
            if (v instanceof Date) return `'${v.toISOString()}'`;
            if (Array.isArray(v)) return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
            if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
            return `'${String(v).replace(/'/g, "''")}'`;
          }).join(', ');
          lines.push(`INSERT INTO "${tablename}" (${cols}) VALUES (${vals});`);
        }
        lines.push('');
      } catch (e) {
        lines.push(`-- Skipped ${tablename}: ${(e as Error).message}`);
      }
    }

    await client.end();
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    const size = (fs.statSync(file).size / 1024).toFixed(1);
    console.log(`[Backup] ✓ Backup saved to ${file} (${size} KB)`);
  }

  deleteOldBackups();
}

function todayBackupExists(): boolean {
  if (!fs.existsSync(BACKUP_DIR)) return false;
  const today = new Date();
  const prefix = `suraksha_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return fs.readdirSync(BACKUP_DIR).some(f => f.startsWith(prefix));
}

export function setupBackupCron(): void {
  // Run every day at 02:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[Backup] Starting scheduled daily backup...');
    try {
      await runBackup();
    } catch (err) {
      console.error('[Backup] ✗ Backup failed:', err);
    }
  });

  // On startup: if today's backup is missing (backend was off at 2 AM), run one now
  if (!todayBackupExists()) {
    console.log("[Backup] Today's backup not found — running startup backup...");
    runBackup()
      .then(() => console.log('[Backup] Startup backup complete.'))
      .catch(err => console.error('[Backup] Startup backup failed:', err));
  } else {
    console.log("[Backup] Today's backup already exists — skipping startup backup.");
  }

  console.log('[Backup] Daily backup scheduled at 02:00 AM → D:\\SurakshaBackups');
}

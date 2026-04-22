const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
console.log('Connecting to:', connectionString);

const pool = new Pool({ connectionString });

async function main() {
  try {
    const res = await pool.query('SELECT current_database(), current_user');
    console.log('CONNECTED:', res.rows[0]);
    
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('TABLES:', tables.rows.map(t => t.table_name).join(', '));
    
  } catch (err) {
    console.error('CONNECTION_FAILED:', err.message);
  } finally {
    await pool.end();
  }
}

main();

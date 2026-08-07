import dotenv from 'dotenv';
dotenv.config();
import { runBackup } from '../src/services/backupService';

runBackup()
  .then(() => { console.log('Backup complete.'); process.exit(0); })
  .catch(e => { console.error('Backup failed:', e.message); process.exit(1); });

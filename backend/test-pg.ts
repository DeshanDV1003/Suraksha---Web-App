import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
console.log('Connection string:', connectionString);

const pool = new pg.Pool({ connectionString });

async function main() {
  try {
    console.log('Testing PG connection...');
    const res = await pool.query('SELECT NOW()');
    console.log('Successfully connected to the database:', res.rows[0]);
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  } finally {
    await pool.end();
  }
}

main();

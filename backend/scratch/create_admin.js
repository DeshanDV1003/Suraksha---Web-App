const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = 'f8ca7916-d55c-427d-8747-4aaadb324749'; // Match the one from their previous session if possible? 
    // Actually, I'll just use a fresh one.
    
    await pool.query(
      'INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
      [
        'f8ca7916-d55c-427d-8747-4aaadb324749', 
        'admin@suraksha.gov', 
        hashedPassword, 
        'System Admin', 
        'ADMIN'
      ]
    );
    console.log('ADMIN_CREATED: admin@suraksha.gov / password123');
  } catch (err) {
    console.error('FAILED:', err.message);
  } finally {
    await pool.end();
  }
}

main();

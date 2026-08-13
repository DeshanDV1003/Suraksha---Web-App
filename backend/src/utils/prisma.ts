import { PrismaClient } from '../../prisma/generated/client';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in environment variables');
} else {
  console.log('🔌 Initializing database connection...');
}

const prisma = new PrismaClient({
  log: ['error', 'warn']
});

export default prisma;

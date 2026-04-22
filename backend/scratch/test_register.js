const bcrypt = require('bcryptjs');
const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const email = 'test_manual@gmail.com';
    const password = 'password123';
    const name = 'Test User';
    const role = 'VOLUNTEER';
    const phone = '0777777777';

    console.log('Hatching password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Creating user...');
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        phone,
      },
    });
    console.log('SUCCESS:', user.id);
  } catch (err) {
    console.error('FAILED:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();

const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('USER_COUNT:', users.length);
  users.forEach(u => console.log(`- ${u.email} (${u.role})`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient();
async function seed() {
  await prisma.kPIBenchmark.create({
    data: { month: '2026-06', targetAvgResponse: 45, targetOccupancy: 80, targetVolunteer: 50 }
  }).catch(() => {});
  const budget = await prisma.disasterBudget.create({
    data: { eventName: 'Monsoon Flood Relief 2026', allocatedBudget: 15000000 }
  }).catch(() => {});
  if (budget) {
    const cost = await prisma.resourceCost.create({
      data: { resourceType: 'Medical Kit', unitCost: 2500, unitType: 'kit' }
    }).catch(() => {});
    if (cost) {
      await prisma.resourceExpenditure.create({
        data: { resourceCostId: cost.id, budgetId: budget.id, quantity: 200, totalCost: 500000 }
      }).catch(() => {});
    }
  }
  console.log('seeded');
}
seed().catch(console.error).finally(() => prisma.$disconnect());

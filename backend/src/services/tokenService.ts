import prisma from '../utils/prisma';

export const listTokens = async () => {
  return prisma.reliefToken.findMany({
    include: {
      user: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const createToken = async (userId: string) => {
  const code = `SRK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  return prisma.reliefToken.create({
    data: {
      userId,
      code,
      qrCodeData: code,
      status: 'ACTIVE'
    }
  });
};

export const useToken = async (code: string) => {
  const token = await prisma.reliefToken.findUnique({ where: { code } });
  if (!token) throw new Error('Invalid token code');
  if (token.status === 'FULLY_USED') throw new Error('Token already used');

  const newCount = token.usageCount + 1;
  const newStatus = newCount >= token.maxUsage ? 'FULLY_USED' : 'PARTIALLY_USED';

  return prisma.reliefToken.update({
    where: { id: token.id },
    data: { usageCount: newCount, status: newStatus }
  });
};

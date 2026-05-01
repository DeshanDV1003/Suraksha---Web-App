import prisma from '../utils/prisma';

export const listTokens = async () => {
  return prisma.token.findMany({
    include: {
      user: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const createToken = async (userId: string, type: string) => {
  const code = `SRK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  return prisma.token.create({
    data: {
      userId,
      type,
      code,
      status: 'ACTIVE'
    }
  });
};

export const useToken = async (code: string) => {
  const token = await prisma.token.findUnique({ where: { code } });
  if (!token) throw new Error('Invalid token code');
  if (token.status === 'USED') throw new Error('Token already used');

  return prisma.token.update({
    where: { id: token.id },
    data: { status: 'USED' }
  });
};

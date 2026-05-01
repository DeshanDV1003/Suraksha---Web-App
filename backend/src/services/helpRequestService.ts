import prisma from '../utils/prisma';

export const createHelpRequest = async (userId: string, data: any) => {
  return prisma.helpRequest.create({
    data: {
      ...data,
      userId
    }
  });
};

export const getHelpRequests = async () => {
  return prisma.helpRequest.findMany({
    include: {
      user: { select: { name: true, phone: true } },
      verifierActions: {
        include: { verifier: { include: { user: { select: { name: true } } } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const registerVerifier = async (userId: string, data: any) => {
  const { verifierRole, jurisdiction, orgName } = data;
  return prisma.localVerifier.create({
    data: {
      userId,
      verifierRole,
      jurisdiction,
      orgName
    }
  });
};

export const createVerifierAction = async (userId: string, data: any) => {
  const { incidentId, helpRequestId, result, comment } = data;
  const verifier = await prisma.localVerifier.findUnique({ where: { userId } });
  if (!verifier) throw new Error('Only registered verifiers can perform this action');

  const action = await prisma.verifierAction.create({
    data: {
      verifierId: verifier.id,
      incidentId,
      helpRequestId,
      result,
      comment
    }
  });

  await prisma.localVerifier.update({
    where: { id: verifier.id },
    data: { verificationsCount: { increment: 1 } }
  });

  return action;
};

/**
 * Lightweight stand-in for `backend/src/utils/prisma.ts`.
 *
 * The real module instantiates a PrismaClient at import time, which unit tests
 * must never do. Test files that import a backend module which (transitively)
 * pulls in Prisma should call:
 *
 *   vi.mock('<relative path to backend/src/utils/prisma>', () => import('<this file>'));
 *
 * or provide their own inline factory when they need to assert on calls.
 */
const handler: ProxyHandler<Record<string, unknown>> = {
  get: () => new Proxy(() => Promise.resolve(undefined), handler),
  apply: () => Promise.resolve(undefined),
};

const prisma = new Proxy({}, handler);

export default prisma;

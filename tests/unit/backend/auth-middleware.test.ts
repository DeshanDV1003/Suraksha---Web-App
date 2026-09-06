import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  authMiddleware,
  adminMiddleware,
  officerMiddleware,
  hospitalMiddleware,
} from '../../../backend/src/middleware/auth';

const SECRET = process.env.JWT_SECRET as string;

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockReq(headerValue?: string, user?: unknown) {
  return {
    header: (name: string) =>
      name === 'Authorization' ? headerValue : undefined,
    user,
  } as any;
}

describe('authMiddleware', () => {
  let next: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    next = vi.fn();
  });

  it('rejects a request with no Authorization header (401)', () => {
    const res = mockRes();
    authMiddleware(mockReq(undefined), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token, authorization denied' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a malformed / wrongly-signed token (401)', () => {
    const res = mockRes();
    const bad = jwt.sign({ userId: 'u1' }, 'the-wrong-secret');
    authMiddleware(mockReq(`Bearer ${bad}`), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token is not valid' });
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a valid token, attaches the payload to req.user and calls next()', () => {
    const res = mockRes();
    const req = mockReq(
      `Bearer ${jwt.sign({ userId: 'u1', role: 'ADMIN' }, SECRET)}`,
    );
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toMatchObject({ userId: 'u1', role: 'ADMIN' });
  });

  it('tolerates a token passed without the "Bearer " prefix', () => {
    const res = mockRes();
    const req = mockReq(jwt.sign({ userId: 'u2', role: 'CITIZEN' }, SECRET));
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ userId: 'u2' });
  });
});

describe('role guards', () => {
  let next: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    next = vi.fn();
  });

  it('adminMiddleware allows ADMIN and blocks everyone else (403)', () => {
    adminMiddleware(mockReq(undefined, { role: 'ADMIN' }), mockRes(), next);
    expect(next).toHaveBeenCalledOnce();

    const res = mockRes();
    adminMiddleware(mockReq(undefined, { role: 'DMC_OFFICER' }), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('officerMiddleware allows ADMIN and DMC_OFFICER, blocks CITIZEN', () => {
    for (const role of ['ADMIN', 'DMC_OFFICER']) {
      const n = vi.fn();
      officerMiddleware(mockReq(undefined, { role }), mockRes(), n);
      expect(n).toHaveBeenCalledOnce();
    }
    const res = mockRes();
    officerMiddleware(mockReq(undefined, { role: 'CITIZEN' }), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('hospitalMiddleware allows only HOSPITAL_STAFF', () => {
    hospitalMiddleware(mockReq(undefined, { role: 'HOSPITAL_STAFF' }), mockRes(), next);
    expect(next).toHaveBeenCalledOnce();

    const res = mockRes();
    hospitalMiddleware(mockReq(undefined, { role: 'ADMIN' }), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('role guards block when req.user is missing entirely', () => {
    const res = mockRes();
    adminMiddleware(mockReq(undefined, undefined), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

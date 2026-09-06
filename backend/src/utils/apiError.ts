import { Response } from 'express';
import { Prisma } from '../../prisma/generated/client';

/**
 * Error carrying an explicit HTTP status. Throw this from services/controllers
 * for client-facing validation failures.
 */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

/**
 * Assert that every named field is present (not undefined / null / '') on `body`.
 * Throws HttpError(400) listing the missing fields.
 */
export function requireFields(body: any, fields: string[]): void {
  const missing = fields.filter((f) => {
    const v = body?.[f];
    return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
  });
  if (missing.length > 0) {
    throw new HttpError(400, `Missing required field(s): ${missing.join(', ')}`);
  }
}

/**
 * Uniform error responder. Maps validation-class errors to 400 so a bad request
 * body never surfaces as a raw 500 / Prisma stack.
 */
export function sendError(res: Response, error: unknown, context = 'Request failed') {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ message: 'Invalid request body — a required field is missing or has the wrong type.' });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 unique, P2003 FK, P2025 record not found
    if (error.code === 'P2025') return res.status(404).json({ message: 'Resource not found.' });
    if (error.code === 'P2002') return res.status(409).json({ message: 'A record with these details already exists.' });
    if (error.code === 'P2003') return res.status(400).json({ message: 'Referenced resource does not exist.' });
    return res.status(400).json({ message: 'Request could not be processed.' });
  }
  console.error(`${context}:`, error);
  return res.status(500).json({ message: 'Internal server error' });
}

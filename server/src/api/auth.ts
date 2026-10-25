import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { sendError } from './http.ts';

const digest = (s: string) => createHash('sha256').update(s).digest();

/** Порівняння ключів за сталий час (без витоку довжини чи префікса через час відповіді) */
export function keysMatch(expected: string, presented: string | undefined): boolean {
  if (!presented) return false;
  return timingSafeEqual(digest(expected), digest(presented));
}

export function findPartnerId(
  keys: Record<string, string>,
  presented: string | undefined,
): string | undefined {
  return Object.entries(keys).find(([, key]) => keysMatch(key, presented))?.[0];
}

export function requireAdmin(adminKey: string): RequestHandler {
  return (req, res, next) => {
    if (!keysMatch(adminKey, req.get('X-Admin-Key'))) return sendError(res, 401, 'Invalid admin key');
    next();
  };
}

export function requirePartner(partnerKeys: Record<string, string>): RequestHandler {
  return (req, res, next) => {
    const partnerId = findPartnerId(partnerKeys, req.get('X-Partner-Key'));
    if (!partnerId) return sendError(res, 401, 'Invalid partner key');
    res.locals.partnerId = partnerId;
    next();
  };
}

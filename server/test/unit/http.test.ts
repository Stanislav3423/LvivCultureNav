import { describe, expect, it } from 'vitest';
import type { Response } from 'express';
import { notFound, parseId, sendError } from '../../src/api/http.ts';

function fakeResponse() {
  const sent: { status?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      sent.status = code;
      return res;
    },
    json(body: unknown) {
      sent.body = body;
      return res;
    },
  };
  return { res: res as unknown as Response, sent };
}

describe('спільні відповіді HTTP-шару', () => {
  it('parseId приймає лише додатні цілі', () => {
    expect(parseId('7')).toBe(7);
    expect(parseId(3)).toBe(3);
    for (const raw of ['0', '-1', '1.5', 'abc', '', undefined]) expect(parseId(raw)).toBeUndefined();
  });

  it('sendError і notFound віддають помилку в єдиному форматі', () => {
    const plain = fakeResponse();
    sendError(plain.res, 401, 'Invalid admin key');
    expect(plain.sent).toEqual({ status: 401, body: { error: 'Invalid admin key' } });

    const detailed = fakeResponse();
    sendError(detailed.res, 400, { error: 'Validation failed', details: ['x'] });
    expect(detailed.sent.body).toEqual({ error: 'Validation failed', details: ['x'] });

    const missing = fakeResponse();
    notFound(missing.res);
    expect(missing.sent).toEqual({ status: 404, body: { error: 'Event not found' } });
  });
});

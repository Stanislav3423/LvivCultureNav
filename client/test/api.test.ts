import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, adminApi, fetchEvents, fetchRoute, request } from '../src/api.ts';
import { mockFetch, operaFull } from './helpers.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api клієнта', () => {
  it('обробляє відповіді: JSON, 204 і помилки з деталями', async () => {
    mockFetch((url) => {
      if (url === '/ok') return { body: { status: 'ok' } };
      if (url === '/empty') return { status: 204 };
      return { status: 400, body: { error: 'Validation failed', details: ['startsAt must be an ISO date'] } };
    });
    await expect(request('/ok')).resolves.toEqual({ status: 'ok' });
    await expect(request('/empty')).resolves.toBeUndefined();
    const err = await request('/bad').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      status: 400,
      message: 'Validation failed',
      details: ['startsAt must be an ISO date'],
    });
  });

  it('звертається до потрібних адрес і передає ключ адміністратора', async () => {
    const fetch = mockFetch(() => ({ body: operaFull() }));
    const api = adminApi('secret');
    const { id: _id, source: _source, ...input } = operaFull();

    await fetchEvents('pl');
    await fetchRoute('center', 5);
    await api.list();
    await api.create(input);
    await api.update(1, input);
    await api.remove(1);

    expect(fetch.mock.calls.map(([url, init]) => `${init?.method ?? 'GET'} ${url}`)).toEqual([
      'GET /api/events?lang=pl',
      'GET /api/route?terminal=center&eventId=5',
      'GET /api/admin/events',
      'POST /api/admin/events',
      'PUT /api/admin/events/1',
      'DELETE /api/admin/events/1',
    ]);
    const [, init] = fetch.mock.calls[4];
    expect(new Headers(init?.headers).get('X-Admin-Key')).toBe('secret');
    expect(JSON.parse(String(init?.body))).toEqual(input);
  });
});

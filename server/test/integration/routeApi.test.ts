import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { TERMINALS } from '@lcn/shared';
import { createOsrmRouting } from '../../src/services/routing.ts';
import { fakeRouting, makeTestApp, opera } from './helpers.ts';

describe('GET /api/route — маршрут від терміналу до події (US-05, US-06, REQ-2.3)', () => {
  it('будує маршрут від обраного терміналу до координат події з бази', async () => {
    const spy = vi.spyOn(fakeRouting, 'route');
    const { app, repo } = makeTestApp(fakeRouting);
    const { id } = repo.create(opera());

    const res = await request(app).get(`/api/route?terminal=center&eventId=${id}`).expect(200);

    expect(spy).toHaveBeenCalledWith(TERMINALS.center, { lat: 49.8441, lng: 24.0262 });
    expect(res.body).toMatchObject({ mode: 'online', distanceMeters: 1234, durationMinutes: 16 });
    spy.mockRestore();
  });

  it('коли OSRM недоступний — віддає запасну пряму лінію, а не помилку', async () => {
    const routing = createOsrmRouting({
      baseUrl: 'https://osrm.invalid',
      userAgent: 'test',
      fetch: () => Promise.reject(new TypeError('fetch failed')),
    });
    const { app, repo } = makeTestApp(routing);
    const { id } = repo.create(opera());

    const res = await request(app).get(`/api/route?terminal=station&eventId=${id}`).expect(200);

    expect(res.body.mode).toBe('fallback');
    expect(res.body.geometry).toEqual([
      [TERMINALS.station.lat, TERMINALS.station.lng],
      [49.8441, 24.0262],
    ]);
  });

  it('400 для невідомого терміналу', async () => {
    const { app } = makeTestApp();
    const res = await request(app).get('/api/route?terminal=airport&eventId=1').expect(400);
    expect(res.body.error).toMatch(/terminal/);
  });

  it('400 без eventId', async () => {
    const { app } = makeTestApp();
    await request(app).get('/api/route?terminal=station').expect(400);
  });

  it('404 для неіснуючої події', async () => {
    const { app } = makeTestApp();
    await request(app).get('/api/route?terminal=station&eventId=777').expect(404);
  });
});

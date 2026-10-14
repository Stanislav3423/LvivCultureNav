import { describe, expect, it, vi } from 'vitest';
import { TERMINALS } from '@lcn/shared';
import { createOsrmRouting } from '../../src/services/routing.ts';

const opera = { lat: 49.8441, lng: 24.0262 };

const osrmOk = {
  code: 'Ok',
  routes: [
    {
      distance: 2624.3,
      duration: 2101.9,
      geometry: {
        type: 'LineString',
        coordinates: [
          [23.9945, 49.8396],
          [24.01, 49.842],
          [24.0262, 49.8441],
        ],
      },
    },
  ],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function setup(fetchImpl: (url: string, init?: RequestInit) => Promise<Response>, timeoutMs = 1000) {
  const fetch = vi.fn(fetchImpl);
  const routing = createOsrmRouting({
    baseUrl: 'https://osrm.test/routed-foot',
    userAgent: 'LvivCultureNav-test',
    fetch,
    timeoutMs,
  });
  return { fetch, routing };
}

describe('сервіс маршрутів OSRM (US-05, US-06, REQ-2.3)', () => {
  it('будує пішохідний маршрут вулицями через OSRM', async () => {
    const { fetch, routing } = setup(async () => jsonResponse(osrmOk));

    const r = await routing.route(TERMINALS.station, opera);

    expect(r).toEqual({
      mode: 'online',
      distanceMeters: 2624,
      durationMinutes: 36,
      geometry: [
        [49.8396, 23.9945],
        [49.842, 24.01],
        [49.8441, 24.0262],
      ],
    });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(
      'https://osrm.test/routed-foot/route/v1/foot/23.9945,49.8396;24.0262,49.8441?overview=full&geometries=geojson',
    );
    expect(new Headers(init?.headers).get('User-Agent')).toBe('LvivCultureNav-test');
  });

  it('при помилці HTTP повертає пряму лінію з орієнтовною відстанню', async () => {
    const { routing } = setup(async () => jsonResponse({ message: 'busy' }, 503));

    const r = await routing.route(TERMINALS.station, opera);

    expect(r.mode).toBe('fallback');
    expect(r.geometry).toEqual([
      [TERMINALS.station.lat, TERMINALS.station.lng],
      [opera.lat, opera.lng],
    ]);
    expect(r.distanceMeters).toBeGreaterThan(2300);
    expect(r.distanceMeters).toBeLessThan(2500);
    expect(r.durationMinutes).toBe(Math.ceil(r.distanceMeters / 80));
  });

  it('якщо мережі немає — запасний варіант замість помилки', async () => {
    const { routing } = setup(() => Promise.reject(new TypeError('fetch failed')));
    expect((await routing.route(TERMINALS.center, opera)).mode).toBe('fallback');
  });

  it('якщо OSRM не знайшов маршрут — запасний варіант', async () => {
    const { routing } = setup(async () => jsonResponse({ code: 'NoRoute', routes: [] }));
    expect((await routing.route(TERMINALS.center, opera)).mode).toBe('fallback');
  });

  it('не чекає OSRM довше за тайм-аут', async () => {
    const { routing } = setup(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
      30,
    );
    const started = Date.now();
    const r = await routing.route(TERMINALS.station, opera);
    expect(r.mode).toBe('fallback');
    expect(Date.now() - started).toBeLessThan(500);
  });

  it('кешує успішні маршрути, щоб не навантажувати безкоштовний сервіс', async () => {
    const { fetch, routing } = setup(async () => jsonResponse(osrmOk));
    await routing.route(TERMINALS.station, opera);
    await routing.route(TERMINALS.station, opera);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('не кешує запасний варіант — після відновлення мережі знову йде в OSRM', async () => {
    let online = false;
    const { fetch, routing } = setup(async () => (online ? jsonResponse(osrmOk) : jsonResponse({}, 500)));
    expect((await routing.route(TERMINALS.station, opera)).mode).toBe('fallback');
    online = true;
    expect((await routing.route(TERMINALS.station, opera)).mode).toBe('online');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

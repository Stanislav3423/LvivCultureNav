import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RouteResult } from '@lcn/shared';
import { minutesFromSeconds, walkingMinutes } from '../../src/domain/geo.ts';
import { RouteCache } from '../../src/services/routeCache.ts';
import { toRouteResult } from '../../src/services/routing.ts';
import { createThrottle } from '../../src/services/throttle.ts';

const a = { lat: 49.84, lng: 24.03 };
const b = { lat: 49.83, lng: 24.02 };
const c = { lat: 49.82, lng: 24.01 };
const route = (distanceMeters: number): RouteResult => ({
  mode: 'online',
  distanceMeters,
  durationMinutes: 1,
  geometry: [],
});

afterEach(() => {
  vi.useRealTimers();
});

describe('складові сервісу маршрутів', () => {
  it('хвилини в дорозі округлюються вгору і не бувають нульовими', () => {
    expect(minutesFromSeconds(0)).toBe(1);
    expect(minutesFromSeconds(61)).toBe(2);
    expect(walkingMinutes(81)).toBe(2);
  });

  it('toRouteResult перевертає координати OSRM і відхиляє відповідь без маршруту', () => {
    const result = toRouteResult({
      code: 'Ok',
      routes: [{ distance: 99.6, duration: 59, geometry: { coordinates: [[24.03, 49.84]] } }],
    });
    expect(result).toEqual({
      mode: 'online',
      distanceMeters: 100,
      durationMinutes: 1,
      geometry: [[49.84, 24.03]],
    });
    expect(() => toRouteResult({ code: 'NoRoute', routes: [] })).toThrow('OSRM code NoRoute');
  });

  it('RouteCache розрізняє напрямок і витісняє найстаріший маршрут', () => {
    const cache = new RouteCache(2);
    cache.set(a, b, route(1));
    cache.set(b, a, route(2));
    expect(cache.get(a, b)?.distanceMeters).toBe(1);
    cache.set(a, c, route(3));
    expect(cache.get(a, b)).toBeUndefined();
    expect(cache.get(b, a)?.distanceMeters).toBe(2);
    expect(cache.get(a, c)?.distanceMeters).toBe(3);
  });

  it('createThrottle розносить виклики на інтервал', async () => {
    vi.useFakeTimers();
    const waitForSlot = createThrottle(1000);
    const done: number[] = [];
    void waitForSlot().then(() => done.push(1));
    void waitForSlot().then(() => done.push(2));
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toEqual([1]);
    await vi.advanceTimersByTimeAsync(999);
    expect(done).toEqual([1]);
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toEqual([1, 2]);
  });
});

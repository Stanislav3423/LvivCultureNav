import type { LatLng, RouteResult } from '@lcn/shared';
import { haversineMeters, walkingMinutes } from '../domain/geo.ts';

export interface RoutingService {
  route(from: LatLng, to: LatLng): Promise<RouteResult>;
}

export interface OsrmOptions {
  /** напр. https://routing.openstreetmap.de/routed-foot */
  baseUrl: string;
  /** політика FOSSGIS вимагає ідентифікувати застосунок */
  userAgent: string;
  fetch?: (url: string, init?: RequestInit) => Promise<Response>;
  timeoutMs?: number;
  /** мінімальний інтервал між запитами до OSRM (політика: ≤ 1 запит/с) */
  minIntervalMs?: number;
  cacheSize?: number;
}

interface OsrmResponse {
  code?: string;
  routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
}

/** Пряма лінія з орієнтовною відстанню — термінал ніколи не лишається без відповіді */
export function straightLine(from: LatLng, to: LatLng): RouteResult {
  const distanceMeters = Math.round(haversineMeters(from, to));
  return {
    mode: 'fallback',
    distanceMeters,
    durationMinutes: walkingMinutes(distanceMeters),
    geometry: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ],
  };
}

export function createOsrmRouting(options: OsrmOptions): RoutingService {
  const { baseUrl, userAgent, timeoutMs = 5000, minIntervalMs = 0, cacheSize = 200 } = options;
  const doFetch = options.fetch ?? globalThis.fetch;
  const cache = new Map<string, RouteResult>();
  let nextSlot = 0;

  async function waitForSlot() {
    const now = Date.now();
    const wait = Math.max(0, nextSlot - now);
    nextSlot = Math.max(now, nextSlot) + minIntervalMs;
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  }

  async function fetchOsrm(from: LatLng, to: LatLng): Promise<RouteResult> {
    await waitForSlot();
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const url = `${baseUrl}/route/v1/foot/${coords}?overview=full&geometries=geojson`;
    const res = await doFetch(url, {
      headers: { 'User-Agent': userAgent, Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const data = (await res.json()) as OsrmResponse;
    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route) throw new Error(`OSRM code ${data.code}`);
    return {
      mode: 'online',
      distanceMeters: Math.round(route.distance),
      durationMinutes: Math.max(1, Math.ceil(route.duration / 60)),
      geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    };
  }

  return {
    async route(from, to) {
      const key = `${from.lat},${from.lng}->${to.lat},${to.lng}`;
      const cached = cache.get(key);
      if (cached) return cached;
      try {
        const result = await fetchOsrm(from, to);
        if (cache.size >= cacheSize) cache.delete(cache.keys().next().value!);
        cache.set(key, result);
        return result;
      } catch (err) {
        console.warn(`Routing fallback: ${(err as Error).message}`);
        return straightLine(from, to);
      }
    },
  };
}

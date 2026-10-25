import type { LatLng, RouteResult } from '@lcn/shared';
import { haversineMeters, minutesFromSeconds, walkingMinutes } from '../domain/geo.ts';
import { RouteCache } from './routeCache.ts';
import { createThrottle } from './throttle.ts';

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

export interface OsrmResponse {
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

/** Відповідь OSRM → маршрут терміналу; OSRM віддає точки як [lng, lat] */
export function toRouteResult(data: OsrmResponse): RouteResult {
  const route = data.routes?.[0];
  if (data.code !== 'Ok' || !route) throw new Error(`OSRM code ${data.code}`);
  return {
    mode: 'online',
    distanceMeters: Math.round(route.distance),
    durationMinutes: minutesFromSeconds(route.duration),
    geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
  };
}

export function createOsrmRouting(options: OsrmOptions): RoutingService {
  const { baseUrl, userAgent, timeoutMs = 5000, minIntervalMs = 0, cacheSize = 200 } = options;
  const doFetch = options.fetch ?? globalThis.fetch;
  const cache = new RouteCache(cacheSize);
  const waitForSlot = createThrottle(minIntervalMs);

  async function fetchOsrm(from: LatLng, to: LatLng): Promise<OsrmResponse> {
    await waitForSlot();
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const res = await doFetch(`${baseUrl}/route/v1/foot/${coords}?overview=full&geometries=geojson`, {
      headers: { 'User-Agent': userAgent, Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    return (await res.json()) as OsrmResponse;
  }

  return {
    async route(from, to) {
      const cached = cache.get(from, to);
      if (cached) return cached;
      try {
        const result = toRouteResult(await fetchOsrm(from, to));
        cache.set(from, to, result);
        return result;
      } catch (err) {
        console.warn(`Routing fallback: ${(err as Error).message}`);
        return straightLine(from, to);
      }
    },
  };
}

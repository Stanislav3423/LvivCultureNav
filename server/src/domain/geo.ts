import type { LatLng } from '@lcn/shared';

const EARTH_RADIUS_M = 6_371_000;
/** 4,8 км/год — середня швидкість пішохода */
export const WALK_METERS_PER_MIN = 80;

/** Відстань по прямій між двома точками на сфері (формула гаверсинуса), у метрах */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Час у дорозі округлюється вгору до цілих хвилин, але не менше однієї */
const wholeMinutes = (minutes: number) => Math.max(1, Math.ceil(minutes));

export function walkingMinutes(meters: number): number {
  return wholeMinutes(meters / WALK_METERS_PER_MIN);
}

export function minutesFromSeconds(seconds: number): number {
  return wholeMinutes(seconds / 60);
}

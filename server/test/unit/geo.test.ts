import { describe, expect, it } from 'vitest';
import { TERMINALS } from '@lcn/shared';
import { haversineMeters, walkingMinutes } from '../../src/domain/geo.ts';

describe('геометрія маршруту (US-06)', () => {
  it('відстань від точки до самої себе — 0', () => {
    expect(haversineMeters(TERMINALS.station, TERMINALS.station)).toBe(0);
  });

  it('вокзал → площа Ринок ≈ 2,6 км по прямій', () => {
    const rynok = { lat: 49.8419, lng: 24.0316 };
    expect(haversineMeters(TERMINALS.station, rynok)).toBeGreaterThan(2600);
    expect(haversineMeters(TERMINALS.station, rynok)).toBeLessThan(2750);
  });

  it('відстань симетрична', () => {
    const opera = { lat: 49.8441, lng: 24.0262 };
    expect(haversineMeters(opera, TERMINALS.center)).toBeCloseTo(haversineMeters(TERMINALS.center, opera), 6);
  });

  it('час пішки рахується за швидкістю 4,8 км/год і округлюється вгору', () => {
    expect(walkingMinutes(800)).toBe(10);
    expect(walkingMinutes(801)).toBe(11);
  });

  it('мінімальний час — 1 хвилина', () => {
    expect(walkingMinutes(0)).toBe(1);
  });
});

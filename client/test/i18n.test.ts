import { describe, expect, it } from 'vitest';
import { LANGS } from '@lcn/shared';
import { DICTIONARY, eventsCount, formatDateTime, formatDistance, t } from '../src/i18n.ts';

describe('i18n клієнта (US-03, REQ-2.2)', () => {
  it('має однакові ключі в усіх мовах і повертає рядки вибраною мовою', () => {
    const ukKeys = Object.keys(DICTIONARY.uk).sort();
    for (const lang of LANGS) expect(Object.keys(DICTIONARY[lang]).sort()).toEqual(ukKeys);
    expect([t('uk', 'route'), t('en', 'route'), t('pl', 'route')]).toEqual([
      'Прокласти маршрут',
      'Show route',
      'Wyznacz trasę',
    ]);
  });

  it('форматує дати, кількість подій і відстань за правилами мови', () => {
    expect(formatDateTime('2026-10-17T18:00', 'uk')).toMatch(/17 жовтня.*18:00/);
    expect(formatDateTime('2026-10-17T18:00', 'pl')).toMatch(/17 października.*18:00/);
    expect([1, 3, 6].map((n) => eventsCount(n, 'uk'))).toEqual(['1 подія', '3 події', '6 подій']);
    expect([1, 6].map((n) => eventsCount(n, 'en'))).toEqual(['1 event', '6 events']);
    expect([2, 5].map((n) => eventsCount(n, 'pl'))).toEqual(['2 wydarzenia', '5 wydarzeń']);
    expect(formatDistance(2624, 'uk')).toBe('2,6 км');
    expect(formatDistance(2624, 'en')).toBe('2.6 km');
  });
});

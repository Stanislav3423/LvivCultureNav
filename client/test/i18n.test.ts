import { describe, expect, it } from 'vitest';
import { LANGS } from '@lcn/shared';
import { DICTIONARY, eventsCount, formatDateTime, formatDistance, t } from '../src/i18n.ts';

describe('i18n клієнта (US-03, REQ-2.2)', () => {
  it('усі мови мають однаковий набір ключів', () => {
    const ukKeys = Object.keys(DICTIONARY.uk).sort();
    for (const lang of LANGS) expect(Object.keys(DICTIONARY[lang]).sort()).toEqual(ukKeys);
  });

  it('повертає рядок інтерфейсу вибраною мовою', () => {
    expect(t('uk', 'route')).toBe('Прокласти маршрут');
    expect(t('en', 'route')).toBe('Show route');
    expect(t('pl', 'route')).toBe('Wyznacz trasę');
  });

  it('форматує дату за правилами мови', () => {
    expect(formatDateTime('2026-10-17T18:00', 'uk')).toMatch(/17 жовтня.*18:00/);
    expect(formatDateTime('2026-10-17T18:00', 'en')).toMatch(/17 October.*18:00/);
    expect(formatDateTime('2026-10-17T18:00', 'pl')).toMatch(/17 października.*18:00/);
  });

  it('узгоджує кількість подій з числом', () => {
    expect(eventsCount(1, 'uk')).toBe('1 подія');
    expect(eventsCount(3, 'uk')).toBe('3 події');
    expect(eventsCount(6, 'uk')).toBe('6 подій');
    expect(eventsCount(1, 'en')).toBe('1 event');
    expect(eventsCount(6, 'en')).toBe('6 events');
    expect(eventsCount(2, 'pl')).toBe('2 wydarzenia');
    expect(eventsCount(5, 'pl')).toBe('5 wydarzeń');
  });

  it('показує відстань у кілометрах з десятковим роздільником мови', () => {
    expect(formatDistance(2624, 'uk')).toBe('2,6 км');
    expect(formatDistance(2624, 'en')).toBe('2.6 km');
  });
});

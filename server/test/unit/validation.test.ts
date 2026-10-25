import { describe, expect, it } from 'vitest';
import { LVIV_BOUNDS, VALIDATION_ERRORS, isWithinLviv } from '@lcn/shared';
import { validateEventInput } from '../../src/domain/validateEvent.ts';

describe('isWithinLviv', () => {
  it('приймає межі включно і відхиляє все, що не є числом', () => {
    expect(isWithinLviv(LVIV_BOUNDS.minLat, LVIV_BOUNDS.maxLng)).toBe(true);
    expect(isWithinLviv(LVIV_BOUNDS.maxLat + 0.01, 24)).toBe(false);
    expect(isWithinLviv(49.84, LVIV_BOUNDS.minLng - 0.01)).toBe(false);
    expect(isWithinLviv('49.84', 24.03)).toBe(false);
    expect(isWithinLviv(undefined, undefined)).toBe(false);
  });
});

describe('validateEventInput: незалежні перевірки полів', () => {
  it('повертає помилки всіх полів одразу в сталому порядку', () => {
    const errors = validateEventInput({
      startsAt: '2026-13-45',
      lat: 0,
      lng: 0,
      mediaUrl: 'ftp://x',
      translations: { uk: { title: '', venue: 'Опера' }, de: {} },
    });
    expect(errors).toEqual([
      VALIDATION_ERRORS.startsAt,
      VALIDATION_ERRORS.coordinates,
      VALIDATION_ERRORS.mediaUrl,
      'translations.de: unsupported language',
      VALIDATION_ERRORS.ukTitle,
    ]);
  });

  it('вважає порожнє медіа відсутнім, а переклад-не-об’єкт — помилкою', () => {
    const base = { startsAt: '2026-10-17T18:00', lat: 49.84, lng: 24.03 };
    const uk = { title: 'Подія', venue: 'Місце' };
    for (const mediaUrl of [undefined, null, '']) {
      expect(validateEventInput({ ...base, mediaUrl, translations: { uk } })).toEqual([]);
    }
    expect(validateEventInput({ ...base, translations: { uk, en: 'text' } })).toEqual([
      'translations.en must be an object',
    ]);
    expect(validateEventInput({ ...base, translations: 'uk' })).toEqual([VALIDATION_ERRORS.ukRequired]);
  });
});

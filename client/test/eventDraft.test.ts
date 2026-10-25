import { describe, expect, it } from 'vitest';
import { VALIDATION_ERRORS } from '@lcn/shared';
import { ApiError } from '../src/api.ts';
import { draftPoint, toDraft, toInput, withPoint, withTranslation } from '../src/admin/eventDraft.ts';
import { saveErrorMessages } from '../src/admin/formParts.tsx';
import { operaFull } from './helpers.ts';

describe('чернетка форми події', () => {
  it('нова подія починається з площі Ринок і порожніх перекладів усіма мовами', () => {
    const draft = toDraft();
    expect([draft.lat, draft.lng]).toEqual(['49.8419', '24.0316']);
    expect(Object.keys(draft.translations)).toEqual(['uk', 'en', 'pl']);
    expect(draft.translations.pl).toEqual({ title: '', venue: '', category: '', description: '' });
  });

  it('змінює лише одне поле перекладу однієї мови', () => {
    const before = toDraft(operaFull());
    const after = withTranslation(before, 'en', 'title', 'Opera night');
    expect(after.translations.en.title).toBe('Opera night');
    expect(after.translations.en.venue).toBe(before.translations.en.venue);
    expect(after.translations.uk).toBe(before.translations.uk);
    expect(before.translations.en.title).toBe('Natalka Poltavka');
  });

  it('точка існує лише для двох числових координат, і саме вона йде в запит', () => {
    const draft = withPoint(toDraft(), 49.841812, 24.036934);
    expect(draftPoint(draft)).toEqual([49.84181, 24.03693]);
    expect(toInput({ ...draft, mediaUrl: '' })).toMatchObject({
      lat: 49.84181,
      lng: 24.03693,
      mediaUrl: null,
    });

    for (const lat of ['', 'abc']) {
      expect(draftPoint({ ...draft, lat })).toBeNull();
      expect(Number.isNaN(toInput({ ...draft, lat }).lat)).toBe(true);
    }
  });
});

describe('saveErrorMessages', () => {
  it('перекладає відомі помилки валідації, невідомі узагальнює, а мережеві — окремо', () => {
    const invalid = new ApiError(400, 'Validation failed', [VALIDATION_ERRORS.coordinates, 'new rule']);
    expect(saveErrorMessages(invalid)).toEqual([
      'Координати мають бути в межах Львова',
      'Перевірте правильність заповнення полів',
    ]);
    expect(saveErrorMessages(new ApiError(400, 'Validation failed'))).toEqual([
      'Перевірте правильність заповнення полів',
    ]);
    expect(saveErrorMessages(new TypeError('fetch failed'))[0]).toContain('сервер недоступний');
  });
});

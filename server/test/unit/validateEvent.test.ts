import { describe, expect, it } from 'vitest';
import type { EventInput } from '@lcn/shared';
import { validateEventInput } from '../../src/domain/validateEvent.ts';

function valid(): EventInput {
  return {
    startsAt: '2026-10-17T18:00',
    lat: 49.8441,
    lng: 24.0262,
    mediaUrl: null,
    translations: {
      uk: { title: 'Наталка Полтавка', venue: 'Опера', category: 'Опера', description: '' },
    },
  };
}

describe('validateEventInput (REQ-1.1)', () => {
  it('приймає коректну подію', () => {
    expect(validateEventInput(valid())).toEqual([]);
  });

  it('вимагає назву і місце українською', () => {
    const e = valid();
    e.translations.uk = { title: ' ', venue: '', category: '', description: '' };
    expect(validateEventInput(e)).toEqual([
      'translations.uk.title is required',
      'translations.uk.venue is required',
    ]);
  });

  it('вимагає український переклад', () => {
    const e = valid();
    e.translations = { en: { title: 'Opera', venue: 'Opera', category: '', description: '' } };
    expect(validateEventInput(e)).toContain('translations.uk is required');
  });

  it('відхиляє непідтримувану мову', () => {
    const e = valid() as EventInput & { translations: Record<string, unknown> };
    e.translations.de = { title: 'Oper', venue: 'Oper', category: '', description: '' };
    expect(validateEventInput(e)).toContain('translations.de: unsupported language');
  });

  it('відхиляє некоректну дату', () => {
    expect(validateEventInput({ ...valid(), startsAt: 'завтра' })).toContain('startsAt must be an ISO date');
  });

  it('відхиляє координати поза Львовом', () => {
    expect(validateEventInput({ ...valid(), lat: 50.45, lng: 30.52 })).toContain(
      'coordinates must be within Lviv',
    );
  });

  it('відхиляє не-http посилання на медіа', () => {
    expect(validateEventInput({ ...valid(), mediaUrl: 'javascript:alert(1)' })).toContain(
      'mediaUrl must be an http(s) URL',
    );
  });

  it('не падає на зовсім некоректному тілі запиту', () => {
    expect(validateEventInput(null)).toEqual(['body must be an object']);
    expect(validateEventInput({})).toEqual(
      expect.arrayContaining(['startsAt must be an ISO date', 'translations.uk is required']),
    );
  });
});

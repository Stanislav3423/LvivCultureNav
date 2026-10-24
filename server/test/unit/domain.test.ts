import { describe, expect, it } from 'vitest';
import { TERMINALS, type EventInput } from '@lcn/shared';
import { haversineMeters, walkingMinutes } from '../../src/domain/geo.ts';
import { localize } from '../../src/domain/localize.ts';
import { validateEventInput } from '../../src/domain/validateEvent.ts';
import { SEED_EVENTS } from '../../src/seed/events.ts';

const uk = { title: 'Наталка Полтавка', venue: 'Опера', category: 'Опера', description: 'Опис' };
const en = { title: 'Natalka Poltavka', venue: 'Opera House', category: 'Opera', description: 'Description' };
const pl = { title: 'Natałka Połtawka', venue: 'Opera', category: 'Opera', description: 'Opis' };

function valid(): EventInput {
  return { startsAt: '2026-10-17T18:00', lat: 49.8441, lng: 24.0262, mediaUrl: null, translations: { uk } };
}

describe('localize (US-04, REQ-1.3)', () => {
  it('обирає запитану мову, інакше en, інакше uk', () => {
    expect(localize({ uk, en, pl }, 'pl')).toEqual({ lang: 'pl', ...pl });
    expect(localize({ uk, en }, 'pl')).toEqual({ lang: 'en', ...en });
    expect(localize({ uk }, 'en')).toEqual({ lang: 'uk', ...uk });
    expect(localize({ uk, pl: { ...pl, title: '  ' } }, 'pl').lang).toBe('uk'); // порожня назва = перекладу немає
    expect(() => localize({}, 'uk')).toThrow(/translation/i);
  });
});

describe('validateEventInput (REQ-1.1)', () => {
  it('приймає коректну подію і всі демо-дані', () => {
    expect(validateEventInput(valid())).toEqual([]);
    for (const e of SEED_EVENTS) expect(validateEventInput(e)).toEqual([]);
  });

  it('перевіряє переклади', () => {
    expect(
      validateEventInput({ ...valid(), translations: { uk: { ...uk, title: ' ', venue: '' } } }),
    ).toEqual(['translations.uk.title is required', 'translations.uk.venue is required']);
    expect(validateEventInput({ ...valid(), translations: { en } })).toContain('translations.uk is required');
    expect(validateEventInput({ ...valid(), translations: { uk, de: uk } as never })).toContain(
      'translations.de: unsupported language',
    );
  });

  it('перевіряє дату, координати в межах Львова, медіа і саму форму тіла', () => {
    expect(validateEventInput({ ...valid(), startsAt: 'завтра' })).toEqual(['startsAt must be an ISO date']);
    expect(validateEventInput({ ...valid(), lat: 50.45, lng: 30.52 })).toEqual([
      'coordinates must be within Lviv',
    ]);
    expect(validateEventInput({ ...valid(), mediaUrl: 'javascript:alert(1)' })).toEqual([
      'mediaUrl must be an http(s) URL',
    ]);
    expect(validateEventInput(null)).toEqual(['body must be an object']);
    expect(validateEventInput({})).toEqual(
      expect.arrayContaining(['startsAt must be an ISO date', 'translations.uk is required']),
    );
  });
});

describe('геометрія маршруту (US-06)', () => {
  it('рахує відстань гаверсинусом і час пішки', () => {
    const rynok = { lat: 49.8419, lng: 24.0316 };
    expect(haversineMeters(TERMINALS.station, TERMINALS.station)).toBe(0);
    expect(haversineMeters(TERMINALS.station, rynok)).toBeGreaterThan(2600); // вокзал → Ринок ≈ 2,6 км
    expect(haversineMeters(TERMINALS.station, rynok)).toBeLessThan(2750);
    expect(walkingMinutes(800)).toBe(10); // 4,8 км/год
    expect(walkingMinutes(801)).toBe(11); // округлення вгору
    expect(walkingMinutes(0)).toBe(1); // мінімум 1 хвилина
  });
});

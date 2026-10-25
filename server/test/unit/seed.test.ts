import { describe, expect, it } from 'vitest';
import { ADMIN_SOURCE } from '@lcn/shared';
import { openDb } from '../../src/repo/db.ts';
import { createEventsRepo } from '../../src/repo/eventsRepo.ts';
import { SEED_EVENTS } from '../../src/seed/events.ts';
import { reseed, seedIfEmpty } from '../../src/seed/seed.ts';

const repo = () => createEventsRepo(openDb(':memory:'));

describe('засів бази демонстраційними подіями', () => {
  it('seedIfEmpty заповнює лише порожню базу', () => {
    const r = repo();
    expect(seedIfEmpty(r)).toBe(SEED_EVENTS.length);
    expect(seedIfEmpty(r)).toBe(0);
    expect(r.list()).toHaveLength(SEED_EVENTS.length);
    expect(r.list().every((e) => e.source === ADMIN_SOURCE)).toBe(true);
  });

  it('reseed замінює всі події, зокрема партнерські, разом із перекладами', () => {
    const r = repo();
    r.create(SEED_EVENTS[0], 'partner:opera', 'x-1');
    expect(reseed(r)).toBe(SEED_EVENTS.length);
    expect(r.list()).toHaveLength(SEED_EVENTS.length);
    expect(r.findIdByExternal('partner:opera', 'x-1')).toBeUndefined();
  });

  it('репозиторій не зберігає порожніх перекладів і обрізає пробіли', () => {
    const r = repo();
    const { translations } = r.create({
      ...SEED_EVENTS[0],
      translations: {
        uk: { title: ' Назва ', venue: ' Місце ', category: '', description: '' },
        en: { title: '  ', venue: 'Venue', category: '', description: '' },
      },
    });
    expect(translations).toEqual({ uk: { title: 'Назва', venue: 'Місце', category: '', description: '' } });
  });
});

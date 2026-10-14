import { describe, expect, it } from 'vitest';
import type { Translations } from '@lcn/shared';
import { localize } from '../../src/domain/localize.ts';

const uk = { title: 'Наталка Полтавка', venue: 'Опера', category: 'Опера', description: 'Опис' };
const en = { title: 'Natalka Poltavka', venue: 'Opera House', category: 'Opera', description: 'Description' };
const pl = { title: 'Natałka Połtawka', venue: 'Opera', category: 'Opera', description: 'Opis' };

describe('localize (US-04, REQ-1.3)', () => {
  it('повертає переклад запитаною мовою', () => {
    const t: Translations = { uk, en, pl };
    expect(localize(t, 'pl')).toEqual({ lang: 'pl', ...pl });
  });

  it('якщо перекладу немає — повертає англійський', () => {
    expect(localize({ uk, en }, 'pl')).toEqual({ lang: 'en', ...en });
  });

  it('якщо немає ні запитаної, ні англійської — повертає українську', () => {
    expect(localize({ uk }, 'en')).toEqual({ lang: 'uk', ...uk });
  });

  it('вважає переклад з порожньою назвою відсутнім', () => {
    expect(localize({ uk, pl: { ...pl, title: '  ' } }, 'pl').lang).toBe('uk');
  });

  it('кидає помилку, якщо немає жодного перекладу', () => {
    expect(() => localize({}, 'uk')).toThrow(/translation/i);
  });
});

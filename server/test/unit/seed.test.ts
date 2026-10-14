import { describe, expect, it } from 'vitest';
import { validateEventInput } from '../../src/domain/validateEvent.ts';
import { SEED_EVENTS } from '../../src/seed/events.ts';

describe('демонстраційні дані', () => {
  it.each(SEED_EVENTS.map((e) => [e.translations.uk?.title, e]))('«%s» проходить валідацію', (_title, e) => {
    expect(validateEventInput(e)).toEqual([]);
  });
});

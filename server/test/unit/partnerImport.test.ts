import { describe, expect, it } from 'vitest';
import type { EventFull, EventInput } from '@lcn/shared';
import type { EventsRepo } from '../../src/repo/eventsRepo.ts';
import { checkPartnerEvent, importPartnerEvents } from '../../src/services/partnerImport.ts';

const event: EventInput = {
  startsAt: '2026-11-02T19:00',
  lat: 49.8441,
  lng: 24.0262,
  translations: { uk: { title: 'Травіата', venue: 'Опера', category: 'Опера', description: '' } },
};

/** Репозиторій у пам'яті: імпорт перевіряється без SQLite і HTTP */
function memoryRepo() {
  const rows: { id: number; source: string; externalId?: string; input: EventInput }[] = [];
  const repo = {
    create(input: EventInput, source = 'admin', externalId?: string) {
      rows.push({ id: rows.length + 1, source, externalId, input });
      return { id: rows.length } as EventFull;
    },
    update(id: number, input: EventInput) {
      rows[id - 1].input = input;
      return { id } as EventFull;
    },
    findIdByExternal: (source: string, externalId: string) =>
      rows.find((r) => r.source === source && r.externalId === externalId)?.id,
  } as EventsRepo;
  return { repo, rows };
}

describe('імпорт подій партнерів (REQ-1.2)', () => {
  it('checkPartnerEvent відокремлює перевірку від запису і обрізає externalId', () => {
    expect(checkPartnerEvent({ ...event, externalId: ' tr-1 ' }, 0)).toEqual({
      accepted: { externalId: 'tr-1', input: event },
    });
    expect(checkPartnerEvent(null, 3)).toEqual({
      rejected: {
        index: 3,
        externalId: undefined,
        errors: ['externalId is required', 'body must be an object'],
      },
    });
  });

  it('створює нові, оновлює наявні за (партнер, externalId) і рахує відхилені', () => {
    const { repo, rows } = memoryRepo();
    expect(importPartnerEvents(repo, 'opera', [{ ...event, externalId: 'tr-1' }])).toEqual({
      created: 1,
      updated: 0,
      rejected: [],
    });

    const renamed = { ...event, startsAt: '2026-11-03T19:00', externalId: 'tr-1' };
    const result = importPartnerEvents(repo, 'opera', [renamed, { externalId: 'bad' }]);
    expect(result.created).toBe(0);
    expect(result.updated).toBe(1);
    expect(result.rejected.map((r) => [r.index, r.externalId])).toEqual([[1, 'bad']]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ source: 'partner:opera', input: { startsAt: '2026-11-03T19:00' } });
  });
});

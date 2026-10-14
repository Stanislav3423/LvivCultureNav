import type { EventInput, RouteResult } from '@lcn/shared';
import { openDb } from '../../src/repo/db.ts';
import { createEventsRepo } from '../../src/repo/eventsRepo.ts';
import { createApp } from '../../src/api/app.ts';
import type { RoutingService } from '../../src/services/routing.ts';

export const ADMIN_KEY = 'test-admin-key';
export const PARTNER_KEYS = { opera: 'opera-key' };

export function opera(overrides: Partial<EventInput> = {}): EventInput {
  return {
    startsAt: '2026-10-17T18:00',
    lat: 49.8441,
    lng: 24.0262,
    mediaUrl: null,
    translations: {
      uk: {
        title: 'Наталка Полтавка',
        venue: 'Львівська опера',
        category: 'Опера',
        description: 'Опера Лисенка',
      },
      en: { title: 'Natalka Poltavka', venue: 'Lviv Opera', category: 'Opera', description: 'Lysenko opera' },
    },
    ...overrides,
  };
}

export function rynok(): EventInput {
  return {
    startsAt: '2026-10-16T11:00',
    lat: 49.8419,
    lng: 24.0316,
    translations: {
      uk: { title: 'Ярмарок на Ринку', venue: 'Площа Ринок', category: 'Фестиваль', description: '' },
      en: { title: 'Rynok Fair', venue: 'Rynok Square', category: 'Festival', description: '' },
      pl: { title: 'Jarmark na Rynku', venue: 'Rynek', category: 'Festiwal', description: '' },
    },
  };
}

/** Сервіс маршрутів-заглушка: інтеграційні тести API не ходять в інтернет */
export const fakeRouting: RoutingService = {
  async route(from, to): Promise<RouteResult> {
    return {
      mode: 'online',
      distanceMeters: 1234,
      durationMinutes: 16,
      geometry: [
        [from.lat, from.lng],
        [to.lat, to.lng],
      ],
    };
  },
};

/** Застосунок на справжній SQLite у пам'яті */
export function makeTestApp(routing: RoutingService = fakeRouting) {
  const db = openDb(':memory:');
  const repo = createEventsRepo(db);
  const app = createApp({ repo, routing, adminKey: ADMIN_KEY, partnerKeys: PARTNER_KEYS });
  return { app, repo, db };
}

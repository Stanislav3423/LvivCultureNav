import { vi } from 'vitest';
import type { EventFull, EventView } from '@lcn/shared';

export interface FakeReply {
  status?: number;
  body?: unknown;
}

/** Підміняє глобальний fetch: handler отримує URL і параметри запиту та повертає статус і тіло */
export function mockFetch(handler: (url: string, init?: RequestInit) => FakeReply | Promise<FakeReply>) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const { status = 200, body } = await handler(url, init);
    return new Response(status === 204 ? null : JSON.stringify(body ?? {}), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export const operaView = (lang: 'uk' | 'en' = 'uk'): EventView => ({
  id: 1,
  lang,
  title: lang === 'uk' ? '«Наталка Полтавка»' : 'Natalka Poltavka',
  venue: lang === 'uk' ? 'Львівська опера' : 'Lviv Opera',
  category: lang === 'uk' ? 'Опера' : 'Opera',
  description: '',
  startsAt: '2026-10-17T18:00',
  lat: 49.8441,
  lng: 24.0262,
  mediaUrl: null,
});

export const fairView = (lang: 'uk' | 'en' = 'uk'): EventView => ({
  id: 2,
  lang,
  title: lang === 'uk' ? 'Ярмарок на Ринку' : 'Rynok Fair',
  venue: lang === 'uk' ? 'Площа Ринок' : 'Rynok Square',
  category: lang === 'uk' ? 'Фестиваль' : 'Festival',
  description: '',
  startsAt: '2026-10-18T11:00',
  lat: 49.8419,
  lng: 24.0316,
  mediaUrl: null,
});

export const operaFull = (overrides: Partial<EventFull> = {}): EventFull => ({
  id: 1,
  startsAt: '2026-10-17T18:00',
  lat: 49.8441,
  lng: 24.0262,
  mediaUrl: null,
  source: 'admin',
  translations: {
    uk: { title: 'Наталка Полтавка', venue: 'Опера', category: 'Опера', description: 'Опис' },
    en: { title: 'Natalka Poltavka', venue: 'Opera', category: 'Opera', description: 'About' },
  },
  ...overrides,
});

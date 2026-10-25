// Спільні типи та константи для сервера і клієнта (єдина «метафора системи» XP)

export const LANGS = ['uk', 'en', 'pl'] as const;
export type Lang = (typeof LANGS)[number];

/** Порядок запасних мов, якщо переклад потрібною мовою відсутній */
export const FALLBACK_LANGS: readonly Lang[] = ['en', 'uk'];

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** Межі Львова: подія з координатами поза ними відхиляється */
export const LVIV_BOUNDS = { minLat: 49.75, maxLat: 49.93, minLng: 23.9, maxLng: 24.15 } as const;

const inRange = (v: unknown, min: number, max: number) => typeof v === 'number' && v >= min && v <= max;

export function isWithinLviv(lat: unknown, lng: unknown): boolean {
  return (
    inRange(lat, LVIV_BOUNDS.minLat, LVIV_BOUNDS.maxLat) &&
    inRange(lng, LVIV_BOUNDS.minLng, LVIV_BOUNDS.maxLng)
  );
}

export const TERMINAL_IDS = ['station', 'center'] as const;
export type TerminalId = (typeof TERMINAL_IDS)[number];

/** Місця встановлення терміналів-навігаторів */
export const TERMINALS: Record<TerminalId, LatLng> = {
  station: { lat: 49.8396, lng: 23.9945 }, // Головний залізничний вокзал
  center: { lat: 49.8389, lng: 24.0302 }, // проспект Свободи
};

export function isTerminalId(value: unknown): value is TerminalId {
  return typeof value === 'string' && (TERMINAL_IDS as readonly string[]).includes(value);
}

export interface EventTranslation {
  title: string;
  venue: string;
  category: string;
  description: string;
}

export type Translations = Partial<Record<Lang, EventTranslation>>;

/** Дані для створення/оновлення події (адмін або партнер) */
export interface EventInput {
  startsAt: string; // ISO 8601, напр. 2026-10-17T18:00
  lat: number;
  lng: number;
  mediaUrl?: string | null;
  translations: Translations;
}

/** Повідомлення валідації події: сервер повертає їх у details, адмін-форма перекладає */
export const VALIDATION_ERRORS = {
  body: 'body must be an object',
  startsAt: 'startsAt must be an ISO date',
  coordinates: 'coordinates must be within Lviv',
  mediaUrl: 'mediaUrl must be an http(s) URL',
  ukRequired: 'translations.uk is required',
  ukTitle: 'translations.uk.title is required',
  ukVenue: 'translations.uk.venue is required',
} as const;

/** Подія з усіма перекладами — для адмін-панелі */
export interface EventFull extends EventInput {
  id: number;
  mediaUrl: string | null;
  source: string;
}

/** Подія, локалізована однією мовою — для терміналу */
export interface EventView extends EventTranslation {
  id: number;
  /** мова, якою фактично віддано контент (може відрізнятись від запитаної) */
  lang: Lang;
  startsAt: string;
  lat: number;
  lng: number;
  mediaUrl: string | null;
}

export type RouteMode = 'online' | 'fallback';

export interface RouteResult {
  mode: RouteMode;
  distanceMeters: number;
  durationMinutes: number;
  /** ламана маршруту: пари [lat, lng] */
  geometry: [number, number][];
}

/** Подія від партнерського ресурсу (театру, музею) */
export interface PartnerEventInput extends EventInput {
  externalId: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  rejected: { index: number; externalId?: string; errors: string[] }[];
}

export interface ApiError {
  error: string;
  details?: string[];
}

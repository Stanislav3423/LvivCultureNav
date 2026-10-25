import type { LatLng } from '@lcn/shared';

/** Тайли OpenStreetMap: безкоштовно, без ключа; підпис авторів OSM обов'язковий */
export const OSM_TILES = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

/** Центр мапи терміналу, доки масштаб не підлаштовано під події */
export const LVIV_CENTER: [number, number] = [49.8405, 24.018];

/** Точка нової події за замовчуванням — площа Ринок */
export const RYNOK_SQUARE: LatLng = { lat: 49.8419, lng: 24.0316 };

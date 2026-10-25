import { LANGS, type EventFull, type EventInput, type EventTranslation, type Lang } from '@lcn/shared';
import { RYNOK_SQUARE } from '../map.ts';

/** Стан форми: координати — рядки з полів введення, переклади — для всіх мов */
export type Draft = Omit<EventInput, 'translations' | 'lat' | 'lng'> & {
  lat: string;
  lng: string;
  translations: Record<Lang, EventTranslation>;
};

const EMPTY: EventTranslation = { title: '', venue: '', category: '', description: '' };

export function toDraft(event?: EventFull): Draft {
  const translations = Object.fromEntries(
    LANGS.map((l) => [l, { ...EMPTY, ...event?.translations[l] }]),
  ) as Record<Lang, EventTranslation>;
  const point = event ?? RYNOK_SQUARE;
  return {
    startsAt: event?.startsAt ?? '',
    lat: String(point.lat),
    lng: String(point.lng),
    mediaUrl: event?.mediaUrl ?? '',
    translations,
  };
}

/** Точка на мапі, якщо обидві координати введено як скінченні числа, інакше null */
export function draftPoint(draft: Draft): [number, number] | null {
  if (draft.lat === '' || draft.lng === '') return null;
  const lat = Number(draft.lat);
  const lng = Number(draft.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}

export function withTranslation(
  draft: Draft,
  lang: Lang,
  field: keyof EventTranslation,
  value: string,
): Draft {
  const translations = { ...draft.translations, [lang]: { ...draft.translations[lang], [field]: value } };
  return { ...draft, translations };
}

/** Точка, обрана на мапі: 5 знаків після коми — це близько метра */
export function withPoint(draft: Draft, lat: number, lng: number): Draft {
  return { ...draft, lat: lat.toFixed(5), lng: lng.toFixed(5) };
}

/** Чернетка → тіло запиту; без точки координати NaN, і сервер поверне помилку координат */
export function toInput(draft: Draft): EventInput {
  const point = draftPoint(draft);
  return {
    startsAt: draft.startsAt,
    lat: point ? point[0] : NaN,
    lng: point ? point[1] : NaN,
    mediaUrl: draft.mediaUrl || null,
    translations: draft.translations,
  };
}

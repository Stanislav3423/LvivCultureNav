import { LVIV_BOUNDS, isLang } from '@lcn/shared';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isBlank(v: unknown): boolean {
  return typeof v !== 'string' || v.trim() === '';
}

function validateTranslations(raw: unknown): string[] {
  if (!isObject(raw)) return ['translations.uk is required'];
  const errors: string[] = [];
  for (const [lang, t] of Object.entries(raw)) {
    if (!isLang(lang)) errors.push(`translations.${lang}: unsupported language`);
    else if (!isObject(t)) errors.push(`translations.${lang} must be an object`);
  }
  const uk = raw.uk;
  if (!isObject(uk)) {
    errors.push('translations.uk is required');
  } else {
    if (isBlank(uk.title)) errors.push('translations.uk.title is required');
    if (isBlank(uk.venue)) errors.push('translations.uk.venue is required');
  }
  return errors;
}

/** Перевіряє тіло запиту на створення/оновлення події. Порожній масив — подія коректна. */
export function validateEventInput(body: unknown): string[] {
  if (!isObject(body)) return ['body must be an object'];
  const errors: string[] = [];

  const { startsAt, lat, lng, mediaUrl } = body;
  if (typeof startsAt !== 'string' || !ISO_DATE.test(startsAt) || Number.isNaN(Date.parse(startsAt))) {
    errors.push('startsAt must be an ISO date');
  }

  const inLviv =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= LVIV_BOUNDS.minLat &&
    lat <= LVIV_BOUNDS.maxLat &&
    lng >= LVIV_BOUNDS.minLng &&
    lng <= LVIV_BOUNDS.maxLng;
  if (!inLviv) errors.push('coordinates must be within Lviv');

  if (mediaUrl !== undefined && mediaUrl !== null && mediaUrl !== '') {
    if (typeof mediaUrl !== 'string' || !/^https?:\/\/\S+$/i.test(mediaUrl)) {
      errors.push('mediaUrl must be an http(s) URL');
    }
  }

  errors.push(...validateTranslations(body.translations));
  return errors;
}

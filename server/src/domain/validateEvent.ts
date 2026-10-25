import { VALIDATION_ERRORS, isLang, isWithinLviv } from '@lcn/shared';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/;
const HTTP_URL = /^https?:\/\/\S+$/i;

type Body = Record<string, unknown>;

function isObject(v: unknown): v is Body {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isBlank(v: unknown): boolean {
  return typeof v !== 'string' || v.trim() === '';
}

function isIsoDate(v: unknown): boolean {
  return typeof v === 'string' && ISO_DATE.test(v) && !Number.isNaN(Date.parse(v));
}

/** Медіа необов'язкове: порожнє значення допустиме, інше — лише http(s)-посилання */
function isOptionalHttpUrl(v: unknown): boolean {
  if (v === undefined || v === null || v === '') return true;
  return typeof v === 'string' && HTTP_URL.test(v);
}

const errorUnless = (ok: boolean, error: string): string[] => (ok ? [] : [error]);

function checkLanguages(translations: Body): string[] {
  return Object.entries(translations).flatMap(([lang, t]) => {
    if (!isLang(lang)) return [`translations.${lang}: unsupported language`];
    return errorUnless(isObject(t), `translations.${lang} must be an object`);
  });
}

/** Український переклад обов'язковий: з нього адміністратор бачить подію в таблиці */
function checkUkrainian(uk: unknown): string[] {
  if (!isObject(uk)) return [VALIDATION_ERRORS.ukRequired];
  return [
    ...errorUnless(!isBlank(uk.title), VALIDATION_ERRORS.ukTitle),
    ...errorUnless(!isBlank(uk.venue), VALIDATION_ERRORS.ukVenue),
  ];
}

function checkTranslations(raw: unknown): string[] {
  if (!isObject(raw)) return [VALIDATION_ERRORS.ukRequired];
  return [...checkLanguages(raw), ...checkUkrainian(raw.uk)];
}

const CHECKS: ((body: Body) => string[])[] = [
  (b) => errorUnless(isIsoDate(b.startsAt), VALIDATION_ERRORS.startsAt),
  (b) => errorUnless(isWithinLviv(b.lat, b.lng), VALIDATION_ERRORS.coordinates),
  (b) => errorUnless(isOptionalHttpUrl(b.mediaUrl), VALIDATION_ERRORS.mediaUrl),
  (b) => checkTranslations(b.translations),
];

/** Перевіряє тіло запиту на створення/оновлення події. Порожній масив — подія коректна. */
export function validateEventInput(body: unknown): string[] {
  if (!isObject(body)) return [VALIDATION_ERRORS.body];
  return CHECKS.flatMap((check) => check(body));
}

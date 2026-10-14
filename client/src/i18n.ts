import type { Lang } from '@lcn/shared';

// Рядки інтерфейсу. Контент подій приходить із сервера вже потрібною мовою.
const uk = {
  locale: 'uk-UA',
  sub: 'Культурні події Львова',
  here: 'Ви тут',
  station: 'Вокзал',
  center: 'Центр',
  events: 'Події',
  details: 'Деталі події',
  route: 'Прокласти маршрут',
  hideRoute: 'Сховати маршрут',
  buildingRoute: 'Будуємо маршрут…',
  walk: 'пішки',
  min: 'хв',
  km: 'км',
  onlineRoute: 'Пішохідний маршрут вулицями',
  fallbackRoute: 'Сервіс маршрутів недоступний — показано пряму лінію, відстань орієнтовна',
  routeError: 'Не вдалося побудувати маршрут. Спробуйте ще раз.',
  photo: 'Фото події',
  hint: 'Торкніться маркера або картки, щоб побачити деталі',
  empty: 'Оберіть подію на мапі або у списку',
  language: 'Мова',
  map: 'Мапа Львова',
  fallbackLang: 'Переклад цією мовою відсутній — показано',
  loadError: 'Не вдалося завантажити події. Перевірте з’єднання.',
  noEvents: 'Найближчим часом подій немає',
};

type Dictionary = typeof uk;

const en: Dictionary = {
  locale: 'en-GB',
  sub: 'Cultural events in Lviv',
  here: 'You are here',
  station: 'Station',
  center: 'Centre',
  events: 'Events',
  details: 'Event details',
  route: 'Show route',
  hideRoute: 'Hide route',
  buildingRoute: 'Building route…',
  walk: 'on foot',
  min: 'min',
  km: 'km',
  onlineRoute: 'Walking route along streets',
  fallbackRoute: 'Routing service unavailable — straight line shown, distance is approximate',
  routeError: 'Could not build the route. Please try again.',
  photo: 'Event photo',
  hint: 'Tap a marker or a card to see details',
  empty: 'Pick an event on the map or in the list',
  language: 'Language',
  map: 'Map of Lviv',
  fallbackLang: 'No translation in this language — shown in',
  loadError: 'Could not load events. Check the connection.',
  noEvents: 'No upcoming events',
};

const pl: Dictionary = {
  locale: 'pl-PL',
  sub: 'Wydarzenia kulturalne we Lwowie',
  here: 'Jesteś tutaj',
  station: 'Dworzec',
  center: 'Centrum',
  events: 'Wydarzenia',
  details: 'Szczegóły wydarzenia',
  route: 'Wyznacz trasę',
  hideRoute: 'Ukryj trasę',
  buildingRoute: 'Wyznaczamy trasę…',
  walk: 'pieszo',
  min: 'min',
  km: 'km',
  onlineRoute: 'Trasa piesza ulicami',
  fallbackRoute: 'Usługa tras niedostępna — pokazano linię prostą, odległość przybliżona',
  routeError: 'Nie udało się wyznaczyć trasy. Spróbuj ponownie.',
  photo: 'Zdjęcie wydarzenia',
  hint: 'Dotknij znacznika lub karty, aby zobaczyć szczegóły',
  empty: 'Wybierz wydarzenie na mapie lub z listy',
  language: 'Język',
  map: 'Mapa Lwowa',
  fallbackLang: 'Brak tłumaczenia w tym języku — pokazano w',
  loadError: 'Nie udało się wczytać wydarzeń. Sprawdź połączenie.',
  noEvents: 'Brak nadchodzących wydarzeń',
};

export const DICTIONARY: Record<Lang, Dictionary> = { uk, en, pl };

export type TextKey = Exclude<keyof Dictionary, 'locale'>;

export function t(lang: Lang, key: TextKey): string {
  return DICTIONARY[lang][key];
}

/** Назва мови для підказки про запасний переклад */
export const LANG_NAMES: Record<Lang, string> = { uk: 'UK', en: 'EN', pl: 'PL' };

const EVENT_FORMS: Record<Lang, Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }> = {
  uk: { one: 'подія', few: 'події', many: 'подій', other: 'події' },
  en: { one: 'event', other: 'events' },
  pl: { one: 'wydarzenie', few: 'wydarzenia', many: 'wydarzeń', other: 'wydarzenia' },
};

export function eventsCount(n: number, lang: Lang): string {
  const rule = new Intl.PluralRules(DICTIONARY[lang].locale).select(n);
  return `${n} ${EVENT_FORMS[lang][rule] ?? EVENT_FORMS[lang].other}`;
}

export function formatDateTime(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(DICTIONARY[lang].locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatDistance(meters: number, lang: Lang): string {
  const km = (meters / 1000).toLocaleString(DICTIONARY[lang].locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${km} ${DICTIONARY[lang].km}`;
}

import { FALLBACK_LANGS, type EventTranslation, type Lang, type Translations } from '@lcn/shared';

export interface Localized extends EventTranslation {
  lang: Lang;
}

function hasContent(t: EventTranslation | undefined): t is EventTranslation {
  return Boolean(t && t.title.trim());
}

/**
 * Обирає переклад події: запитана мова → en → uk.
 * Повертає також мову, якою фактично віддано контент.
 */
export function localize(translations: Translations, lang: Lang): Localized {
  for (const candidate of [lang, ...FALLBACK_LANGS]) {
    const t = translations[candidate];
    if (hasContent(t)) return { lang: candidate, ...t };
  }
  throw new Error('Event has no usable translation');
}

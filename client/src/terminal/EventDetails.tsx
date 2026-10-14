import type { ReactNode } from 'react';
import type { EventView, Lang } from '@lcn/shared';
import { LANG_NAMES, formatDateTime, t } from '../i18n.ts';
import { CalendarIcon, PinIcon } from './icons.tsx';

interface Props {
  event: EventView | null;
  lang: Lang;
  /** нижня зона картки — панель маршруту */
  children?: ReactNode;
}

export function EventDetails({ event, lang, children }: Props) {
  if (!event) {
    return (
      <aside className="details" aria-live="polite">
        <div className="eyebrow">{t(lang, 'details')}</div>
        <div className="empty">{t(lang, 'empty')}</div>
      </aside>
    );
  }

  return (
    <aside className="details" aria-live="polite">
      <div className="eyebrow">{t(lang, 'details')}</div>
      {event.mediaUrl ? (
        <img className="photo" src={event.mediaUrl} alt={t(lang, 'photo')} />
      ) : (
        <div className="photo photo-empty">[{t(lang, 'photo')}]</div>
      )}
      <span className="tag-cat">{event.category}</span>
      <h1>{event.title}</h1>
      {event.lang !== lang && (
        <div className="lang-note">
          {t(lang, 'fallbackLang')} {LANG_NAMES[event.lang]}
        </div>
      )}
      <div className="facts">
        <div className="fact">
          <CalendarIcon />
          <span>{formatDateTime(event.startsAt, lang)}</span>
        </div>
        <div className="fact">
          <PinIcon />
          <span>{event.venue}</span>
        </div>
      </div>
      {event.description && <p>{event.description}</p>}
      {children && <div className="route-zone">{children}</div>}
    </aside>
  );
}

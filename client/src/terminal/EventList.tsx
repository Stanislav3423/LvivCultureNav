import type { EventView, Lang } from '@lcn/shared';
import { eventsCount, formatDateTime, t } from '../i18n.ts';

interface Props {
  events: EventView[];
  lang: Lang;
  selectedId: number | null;
  status: 'loading' | 'ready' | 'error';
  onSelect(id: number): void;
}

export function EventList({ events, lang, selectedId, status, onSelect }: Props) {
  return (
    <section className="list" aria-labelledby="events-heading">
      <div className="list-head">
        <h2 id="events-heading">{t(lang, 'events')}</h2>
        {status === 'ready' && <span>{eventsCount(events.length, lang)}</span>}
      </div>
      {status === 'error' && (
        <p className="notice" role="alert">
          {t(lang, 'loadError')}
        </p>
      )}
      {status === 'ready' && events.length === 0 && <p className="notice">{t(lang, 'noEvents')}</p>}
      <div className="cards">
        {events.map((e, i) => {
          const selected = e.id === selectedId;
          return (
            <button
              key={e.id}
              type="button"
              className={selected ? 'ev-card sel' : 'ev-card'}
              aria-pressed={selected}
              onClick={() => onSelect(e.id)}
            >
              <span className="num">{i + 1}</span>
              <span className="cat">{e.category}</span>
              <span className="title">{e.title}</span>
              <span className="meta">
                {formatDateTime(e.startsAt, lang)} · {e.venue}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

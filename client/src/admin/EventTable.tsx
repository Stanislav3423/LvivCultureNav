import { ADMIN_SOURCE, LANGS, type EventFull } from '@lcn/shared';
import { formatDateTime } from '../i18n.ts';

interface Props {
  events: EventFull[];
  editingId: number | null;
  onEdit(id: number): void;
  onDelete(event: EventFull): void;
}

function TranslationBadges({ event }: { event: EventFull }) {
  return (
    <>
      {LANGS.map((lang) => {
        const t = event.translations[lang];
        const complete = Boolean(t?.title && t.venue && t.description);
        return (
          <span
            key={lang}
            className={complete ? 'lc ok' : 'lc miss'}
            title={complete ? 'Переклад повний' : 'Переклад неповний або відсутній'}
          >
            {lang.toUpperCase()}
            {complete ? '' : ' —'}
          </span>
        );
      })}
    </>
  );
}

export function EventTable({ events, editingId, onEdit, onDelete }: Props) {
  return (
    <div className="tbl-box">
      <table>
        <thead>
          <tr>
            <th>Назва (UK)</th>
            <th>Дата</th>
            <th>Місце</th>
            <th>Переклади</th>
            <th>
              <span className="sr-only">Дії</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => {
            const title = e.translations.uk?.title ?? '';
            return (
              <tr key={e.id} className={e.id === editingId ? 'editing' : undefined}>
                <td>
                  <b>{title}</b>
                  {e.source !== ADMIN_SOURCE && <div className="src">{e.source}</div>}
                </td>
                <td className="nowrap">{formatDateTime(e.startsAt, 'uk')}</td>
                <td>{e.translations.uk?.venue}</td>
                <td className="nowrap">
                  <TranslationBadges event={e} />
                </td>
                <td>
                  <div className="actions">
                    <button
                      className="btn small"
                      type="button"
                      aria-label={`Редагувати «${title}»`}
                      onClick={() => onEdit(e.id)}
                    >
                      Редагувати
                    </button>
                    <button
                      className="btn small danger"
                      type="button"
                      aria-label={`Видалити «${title}»`}
                      onClick={() => onDelete(e)}
                    >
                      Видалити
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

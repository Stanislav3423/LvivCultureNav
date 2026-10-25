import { useState, type FormEvent } from 'react';
import type { EventFull, EventTranslation, Lang } from '@lcn/shared';
import type { AdminApi } from '../api.ts';
import { draftPoint, toDraft, toInput, withPoint, withTranslation, type Draft } from './eventDraft.ts';
import { ErrorList, LangTabs, TextField, saveErrorMessages } from './formParts.tsx';
import { PointPicker } from './PointPicker.tsx';

interface Props {
  /** undefined — нова подія */
  event?: EventFull;
  api: AdminApi;
  onSaved(event: EventFull, created: boolean): void;
  onCancel(): void;
}

export function EventForm({ event, api, onSaved, onCancel }: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(event));
  const [lang, setLang] = useState<Lang>('uk');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const tr = draft.translations[lang];
  const suffix = `(${lang.toUpperCase()})`;
  const patch = (fields: Partial<Draft>) => setDraft((d) => ({ ...d, ...fields }));
  const setTr = (field: keyof EventTranslation) => (value: string) =>
    setDraft((d) => withTranslation(d, lang, field, value));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors([]);
    try {
      const input = toInput(draft);
      const saved = event ? await api.update(event.id, input) : await api.create(input);
      onSaved(saved, !event);
    } catch (err) {
      setErrors(saveErrorMessages(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="adm-form" onSubmit={submit} noValidate aria-labelledby="form-title">
      <h2 id="form-title">{event ? 'Редагування події' : 'Нова подія'}</h2>
      <LangTabs lang={lang} onChange={setLang} />

      <TextField id="f-title" label={`Назва ${suffix}`} value={tr.title} onChange={setTr('title')} />
      <div className="row2">
        <TextField
          id="f-category"
          label={`Категорія ${suffix}`}
          value={tr.category}
          onChange={setTr('category')}
        />
        <TextField id="f-venue" label={`Місце ${suffix}`} value={tr.venue} onChange={setTr('venue')} />
      </div>
      <TextField
        id="f-description"
        label={`Опис ${suffix}`}
        multiline
        value={tr.description}
        onChange={setTr('description')}
      />

      <TextField
        id="f-starts"
        label="Дата і час початку"
        type="datetime-local"
        value={draft.startsAt}
        onChange={(startsAt) => patch({ startsAt })}
      />

      <PointPicker point={draftPoint(draft)} onPick={(lat, lng) => setDraft((d) => withPoint(d, lat, lng))} />
      <div className="row2">
        <TextField
          id="f-lat"
          label="Широта"
          inputMode="decimal"
          value={draft.lat}
          onChange={(lat) => patch({ lat })}
        />
        <TextField
          id="f-lng"
          label="Довгота"
          inputMode="decimal"
          value={draft.lng}
          onChange={(lng) => patch({ lng })}
        />
      </div>
      <TextField
        id="f-media"
        label="Медіа (URL зображення)"
        type="url"
        placeholder="https://…"
        value={draft.mediaUrl ?? ''}
        onChange={(mediaUrl) => patch({ mediaUrl })}
      />

      <ErrorList errors={errors} />

      <div className="form-actions">
        <button className="btn primary" type="submit" disabled={busy}>
          Зберегти
        </button>
        <button className="btn" type="button" onClick={onCancel}>
          Скасувати
        </button>
      </div>
    </form>
  );
}

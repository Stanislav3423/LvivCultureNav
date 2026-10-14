import { useState, type FormEvent } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { LANGS, type EventFull, type EventInput, type EventTranslation, type Lang } from '@lcn/shared';
import { ApiError, type AdminApi } from '../api.ts';

interface Props {
  /** undefined — нова подія */
  event?: EventFull;
  api: AdminApi;
  onSaved(event: EventFull, created: boolean): void;
  onCancel(): void;
}

type Draft = Omit<EventInput, 'translations' | 'lat' | 'lng'> & {
  lat: string;
  lng: string;
  translations: Record<Lang, EventTranslation>;
};

const EMPTY: EventTranslation = { title: '', venue: '', category: '', description: '' };

// Повідомлення сервера (domain/validateEvent) українською для адміністратора
const MESSAGES: Record<string, string> = {
  'translations.uk is required': 'Потрібен український переклад',
  'translations.uk.title is required': 'Назва українською обов’язкова',
  'translations.uk.venue is required': 'Місце українською обов’язкове',
  'startsAt must be an ISO date': 'Вкажіть дату і час початку',
  'coordinates must be within Lviv': 'Координати мають бути в межах Львова',
  'mediaUrl must be an http(s) URL': 'Посилання на медіа має починатися з http:// або https://',
};

const GENERIC_ERROR = 'Перевірте правильність заповнення полів';

const pinIcon = L.divIcon({
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  html: '<div class="ev-marker sel pick"></div>',
});

function toDraft(event?: EventFull): Draft {
  const translations = Object.fromEntries(
    LANGS.map((l) => [l, { ...EMPTY, ...event?.translations[l] }]),
  ) as Record<Lang, EventTranslation>;
  return {
    startsAt: event?.startsAt ?? '',
    lat: event ? String(event.lat) : '49.8419',
    lng: event ? String(event.lng) : '24.0316',
    mediaUrl: event?.mediaUrl ?? '',
    translations,
  };
}

function PickPoint({ onPick }: { onPick(lat: number, lng: number): void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export function EventForm({ event, api, onSaved, onCancel }: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(event));
  const [lang, setLang] = useState<Lang>('uk');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const tr = draft.translations[lang];
  const setTr = (field: keyof EventTranslation, value: string) =>
    setDraft((d) => ({
      ...d,
      translations: { ...d.translations, [lang]: { ...d.translations[lang], [field]: value } },
    }));

  const lat = Number(draft.lat);
  const lng = Number(draft.lng);
  const hasPoint = draft.lat !== '' && draft.lng !== '' && Number.isFinite(lat) && Number.isFinite(lng);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors([]);
    const input: EventInput = {
      startsAt: draft.startsAt,
      lat: hasPoint ? lat : NaN,
      lng: hasPoint ? lng : NaN,
      mediaUrl: draft.mediaUrl || null,
      translations: draft.translations,
    };
    try {
      const saved = event ? await api.update(event.id, input) : await api.create(input);
      onSaved(saved, !event);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setErrors(
          err.details.length ? err.details.map((m) => MESSAGES[m] ?? GENERIC_ERROR) : [GENERIC_ERROR],
        );
      } else {
        setErrors(['Не вдалося зберегти: сервер недоступний. Спробуйте ще раз.']);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="adm-form" onSubmit={submit} noValidate aria-labelledby="form-title">
      <h2 id="form-title">{event ? 'Редагування події' : 'Нова подія'}</h2>

      <div className="tabs" role="tablist" aria-label="Мова контенту">
        {LANGS.map((l) => (
          <button key={l} type="button" role="tab" aria-selected={l === lang} onClick={() => setLang(l)}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="f-title">Назва ({lang.toUpperCase()})</label>
        <input id="f-title" value={tr.title} onChange={(e) => setTr('title', e.target.value)} />
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="f-category">Категорія ({lang.toUpperCase()})</label>
          <input id="f-category" value={tr.category} onChange={(e) => setTr('category', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="f-venue">Місце ({lang.toUpperCase()})</label>
          <input id="f-venue" value={tr.venue} onChange={(e) => setTr('venue', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="f-description">Опис ({lang.toUpperCase()})</label>
        <textarea
          id="f-description"
          value={tr.description}
          onChange={(e) => setTr('description', e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="f-starts">Дата і час початку</label>
        <input
          id="f-starts"
          type="datetime-local"
          value={draft.startsAt}
          onChange={(e) => setDraft((d) => ({ ...d, startsAt: e.target.value }))}
        />
      </div>

      <div className="field">
        <span className="label">Точка на мапі</span>
        <MapContainer
          center={hasPoint ? [lat, lng] : [49.8419, 24.0316]}
          zoom={14}
          className="pick-map"
          attributionControl={false}
        >
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
          <PickPoint
            onPick={(pLat, pLng) => setDraft((d) => ({ ...d, lat: pLat.toFixed(5), lng: pLng.toFixed(5) }))}
          />
          {hasPoint && <Marker position={[lat, lng]} icon={pinIcon} />}
        </MapContainer>
        <span className="help">Торкніться мапи, щоб обрати місце, або введіть координати</span>
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="f-lat">Широта</label>
          <input
            id="f-lat"
            inputMode="decimal"
            value={draft.lat}
            onChange={(e) => setDraft((d) => ({ ...d, lat: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="f-lng">Довгота</label>
          <input
            id="f-lng"
            inputMode="decimal"
            value={draft.lng}
            onChange={(e) => setDraft((d) => ({ ...d, lng: e.target.value }))}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="f-media">Медіа (URL зображення)</label>
        <input
          id="f-media"
          type="url"
          placeholder="https://…"
          value={draft.mediaUrl ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, mediaUrl: e.target.value }))}
        />
      </div>

      {errors.length > 0 && (
        <div className="errors" role="alert">
          <b>Подію не збережено:</b>
          <ul>
            {errors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

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

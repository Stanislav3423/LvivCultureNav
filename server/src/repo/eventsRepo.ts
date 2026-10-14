import { LANGS, type EventFull, type EventInput, type Lang, type Translations } from '@lcn/shared';
import type { Db } from './db.ts';

interface EventRow {
  id: number;
  starts_at: string;
  lat: number;
  lng: number;
  media_url: string | null;
  source: string;
}

interface TranslationRow {
  event_id: number;
  lang: Lang;
  title: string;
  venue: string;
  category: string;
  description: string;
}

export interface EventsRepo {
  list(): EventFull[];
  get(id: number): EventFull | undefined;
  create(input: EventInput, source?: string, externalId?: string): EventFull;
  update(id: number, input: EventInput): EventFull | undefined;
  remove(id: number): boolean;
  findIdByExternal(source: string, externalId: string): number | undefined;
}

export function createEventsRepo(db: Db): EventsRepo {
  const selectAll = db.prepare<[], EventRow>(
    'SELECT id, starts_at, lat, lng, media_url, source FROM events ORDER BY starts_at, id',
  );
  const selectOne = db.prepare<[number], EventRow>(
    'SELECT id, starts_at, lat, lng, media_url, source FROM events WHERE id = ?',
  );
  const selectAllTr = db.prepare<[], TranslationRow>('SELECT * FROM event_translations');
  const selectTr = db.prepare<[number], TranslationRow>(
    'SELECT * FROM event_translations WHERE event_id = ?',
  );
  const insertEvent = db.prepare(
    'INSERT INTO events (starts_at, lat, lng, media_url, source, external_id) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const updateEvent = db.prepare(
    "UPDATE events SET starts_at = ?, lat = ?, lng = ?, media_url = ?, updated_at = datetime('now') WHERE id = ?",
  );
  const deleteEvent = db.prepare('DELETE FROM events WHERE id = ?');
  const deleteTr = db.prepare('DELETE FROM event_translations WHERE event_id = ?');
  const insertTr = db.prepare(
    'INSERT INTO event_translations (event_id, lang, title, venue, category, description) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const selectByExternal = db.prepare<[string, string], { id: number }>(
    'SELECT id FROM events WHERE source = ? AND external_id = ?',
  );

  function toFull(row: EventRow, trRows: TranslationRow[]): EventFull {
    const translations: Translations = {};
    for (const t of trRows) {
      translations[t.lang] = {
        title: t.title,
        venue: t.venue,
        category: t.category,
        description: t.description,
      };
    }
    return {
      id: row.id,
      startsAt: row.starts_at,
      lat: row.lat,
      lng: row.lng,
      mediaUrl: row.media_url,
      source: row.source,
      translations,
    };
  }

  function writeTranslations(eventId: number, translations: Translations) {
    deleteTr.run(eventId);
    for (const lang of LANGS) {
      const t = translations[lang];
      if (!t || !t.title?.trim()) continue; // порожній переклад не зберігаємо
      insertTr.run(
        eventId,
        lang,
        t.title.trim(),
        (t.venue ?? '').trim(),
        (t.category ?? '').trim(),
        (t.description ?? '').trim(),
      );
    }
  }

  function get(id: number): EventFull | undefined {
    const row = selectOne.get(id);
    return row && toFull(row, selectTr.all(id));
  }

  const create = db.transaction((input: EventInput, source: string, externalId: string | null): EventFull => {
    const info = insertEvent.run(
      input.startsAt,
      input.lat,
      input.lng,
      input.mediaUrl || null,
      source,
      externalId,
    );
    const id = Number(info.lastInsertRowid);
    writeTranslations(id, input.translations);
    return get(id)!;
  });

  const update = db.transaction((id: number, input: EventInput): EventFull | undefined => {
    const info = updateEvent.run(input.startsAt, input.lat, input.lng, input.mediaUrl || null, id);
    if (info.changes === 0) return undefined;
    writeTranslations(id, input.translations);
    return get(id);
  });

  return {
    list() {
      const byEvent = new Map<number, TranslationRow[]>();
      for (const t of selectAllTr.all()) {
        byEvent.set(t.event_id, [...(byEvent.get(t.event_id) ?? []), t]);
      }
      return selectAll.all().map((row) => toFull(row, byEvent.get(row.id) ?? []));
    },
    get,
    create: (input, source = 'admin', externalId) => create(input, source, externalId ?? null),
    update: (id, input) => update(id, input),
    remove: (id) => deleteEvent.run(id).changes > 0,
    findIdByExternal: (source, externalId) => selectByExternal.get(source, externalId)?.id,
  };
}

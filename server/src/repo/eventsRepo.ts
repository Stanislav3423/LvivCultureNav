import {
  ADMIN_SOURCE,
  LANGS,
  type EventFull,
  type EventInput,
  type EventTranslation,
  type Lang,
  type Translations,
} from '@lcn/shared';
import type { Db } from './db.ts';

interface EventRow {
  id: number;
  starts_at: string;
  lat: number;
  lng: number;
  media_url: string | null;
  source: string;
}

interface TranslationRow extends EventTranslation {
  event_id: number;
  lang: Lang;
}

export interface EventsRepo {
  list(): EventFull[];
  get(id: number): EventFull | undefined;
  create(input: EventInput, source?: string, externalId?: string): EventFull;
  update(id: number, input: EventInput): EventFull | undefined;
  remove(id: number): boolean;
  findIdByExternal(source: string, externalId: string): number | undefined;
  /** Видаляє всі події разом із перекладами */
  clear(): void;
}

const EVENT_COLUMNS = 'id, starts_at, lat, lng, media_url, source';
const TRANSLATION_COLUMNS = 'event_id, lang, title, venue, category, description';

function prepareStatements(db: Db) {
  return {
    selectAll: db.prepare<[], EventRow>(`SELECT ${EVENT_COLUMNS} FROM events ORDER BY starts_at, id`),
    selectOne: db.prepare<[number], EventRow>(`SELECT ${EVENT_COLUMNS} FROM events WHERE id = ?`),
    selectAllTr: db.prepare<[], TranslationRow>(`SELECT ${TRANSLATION_COLUMNS} FROM event_translations`),
    selectTr: db.prepare<[number], TranslationRow>(
      `SELECT ${TRANSLATION_COLUMNS} FROM event_translations WHERE event_id = ?`,
    ),
    selectByExternal: db.prepare<[string, string], { id: number }>(
      'SELECT id FROM events WHERE source = ? AND external_id = ?',
    ),
    insertEvent: db.prepare(
      'INSERT INTO events (starts_at, lat, lng, media_url, source, external_id) VALUES (?, ?, ?, ?, ?, ?)',
    ),
    updateEvent: db.prepare(
      "UPDATE events SET starts_at = ?, lat = ?, lng = ?, media_url = ?, updated_at = datetime('now') WHERE id = ?",
    ),
    deleteEvent: db.prepare('DELETE FROM events WHERE id = ?'),
    deleteAll: db.prepare('DELETE FROM events'),
    deleteTr: db.prepare('DELETE FROM event_translations WHERE event_id = ?'),
    insertTr: db.prepare(`INSERT INTO event_translations (${TRANSLATION_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?)`),
  };
}

function toEvent(row: EventRow, trRows: TranslationRow[]): EventFull {
  const translations: Translations = {};
  for (const { lang, title, venue, category, description } of trRows) {
    translations[lang] = { title, venue, category, description };
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

/** Переклади всіх подій одним запитом, згруповані за подією (один прохід) */
function groupByEvent(rows: TranslationRow[]): Map<number, TranslationRow[]> {
  const byEvent = new Map<number, TranslationRow[]>();
  for (const t of rows) {
    const list = byEvent.get(t.event_id);
    if (list) list.push(t);
    else byEvent.set(t.event_id, [t]);
  }
  return byEvent;
}

/** Порожній переклад (без назви) не зберігаємо; поля обрізаються від пробілів */
function cleanTranslation(t: Partial<EventTranslation> | undefined): EventTranslation | undefined {
  if (!t?.title?.trim()) return undefined;
  return {
    title: t.title.trim(),
    venue: (t.venue ?? '').trim(),
    category: (t.category ?? '').trim(),
    description: (t.description ?? '').trim(),
  };
}

export function createEventsRepo(db: Db): EventsRepo {
  const sql = prepareStatements(db);

  function writeTranslations(eventId: number, translations: Translations) {
    sql.deleteTr.run(eventId);
    for (const lang of LANGS) {
      const t = cleanTranslation(translations[lang]);
      if (t) sql.insertTr.run(eventId, lang, t.title, t.venue, t.category, t.description);
    }
  }

  function get(id: number): EventFull | undefined {
    const row = sql.selectOne.get(id);
    return row && toEvent(row, sql.selectTr.all(id));
  }

  const create = db.transaction((input: EventInput, source: string, externalId: string | null): EventFull => {
    const { startsAt, lat, lng, mediaUrl } = input;
    const info = sql.insertEvent.run(startsAt, lat, lng, mediaUrl || null, source, externalId);
    const id = Number(info.lastInsertRowid);
    writeTranslations(id, input.translations);
    return get(id)!;
  });

  const update = db.transaction((id: number, input: EventInput): EventFull | undefined => {
    const { startsAt, lat, lng, mediaUrl } = input;
    if (sql.updateEvent.run(startsAt, lat, lng, mediaUrl || null, id).changes === 0) return undefined;
    writeTranslations(id, input.translations);
    return get(id);
  });

  return {
    list() {
      const byEvent = groupByEvent(sql.selectAllTr.all());
      return sql.selectAll.all().map((row) => toEvent(row, byEvent.get(row.id) ?? []));
    },
    get,
    create: (input, source = ADMIN_SOURCE, externalId) => create(input, source, externalId ?? null),
    update: (id, input) => update(id, input),
    remove: (id) => sql.deleteEvent.run(id).changes > 0,
    findIdByExternal: (source, externalId) => sql.selectByExternal.get(source, externalId)?.id,
    clear: () => {
      sql.deleteAll.run();
    },
  };
}

import { useCallback, useEffect, useState } from 'react';
import type { EventFull } from '@lcn/shared';
import { ApiError, adminApi } from '../api.ts';
import { EventForm } from './EventForm.tsx';
import { EventTable } from './EventTable.tsx';
import { LoginForm } from './LoginForm.tsx';

const KEY_STORAGE = 'lcn-admin-key';

function readStoredKey(): string | null {
  try {
    return sessionStorage.getItem(KEY_STORAGE);
  } catch {
    return null;
  }
}

function storeKey(key: string | null) {
  try {
    if (key) sessionStorage.setItem(KEY_STORAGE, key);
    else sessionStorage.removeItem(KEY_STORAGE);
  } catch {
    // сховище недоступне — ключ живе лише в пам'яті вкладки
  }
}

export function AdminPage() {
  const [key, setKey] = useState<string | null>(readStoredKey);
  const [events, setEvents] = useState<EventFull[]>([]);
  // undefined — форма закрита, null — нова подія, число — редагування
  const [editingId, setEditingId] = useState<number | null | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);

  const logout = useCallback(() => {
    storeKey(null);
    setKey(null);
    setEditingId(undefined);
  }, []);

  const reload = useCallback(
    async (k: string) => {
      try {
        setEvents(await adminApi(k).list());
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) logout();
        else throw err;
      }
    },
    [logout],
  );

  // Ключ із sessionStorage: підвантажити події або вийти, якщо ключ уже недійсний
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    adminApi(key)
      .list()
      .then((list) => {
        if (!cancelled) setEvents(list);
      })
      .catch((err) => {
        if (!cancelled && err instanceof ApiError && err.status === 401) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [key, logout]);

  async function login(candidate: string): Promise<boolean> {
    try {
      setEvents(await adminApi(candidate).list());
      storeKey(candidate);
      setKey(candidate);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return false;
      throw err;
    }
  }

  if (!key) return <LoginForm onLogin={login} />;

  const api = adminApi(key);
  const editing = typeof editingId === 'number' ? events.find((e) => e.id === editingId) : undefined;

  async function remove(event: EventFull) {
    if (!window.confirm(`Видалити подію «${event.translations.uk?.title}»?`)) return;
    await api.remove(event.id);
    if (editingId === event.id) setEditingId(undefined);
    setNotice('Подію видалено');
    await reload(key!);
  }

  async function saved(event: EventFull, created: boolean) {
    setNotice(created ? 'Подію створено' : 'Зміни збережено');
    // Подія потрапляє в список одразу: інакше форма до перезавантаження списку
    // вважала б щойно створену подію новою, і повторне збереження створило б дублікат
    setEvents((list) => [...list.filter((e) => e.id !== event.id), event]);
    setEditingId(event.id);
    await reload(key!);
  }

  return (
    <div className="admin">
      <header className="adm-top">
        <div className="brand">
          <span className="brand-name">LvivCultureNav</span>
          <span className="adm-sub">Адмін-панель</span>
        </div>
        <div className="adm-top-actions">
          <a className="btn small" href="/">
            Термінал
          </a>
          <button className="btn small" type="button" onClick={logout}>
            Вийти
          </button>
        </div>
      </header>
      <main className="adm-body">
        <section className="adm-list" aria-labelledby="adm-events">
          <div className="adm-list-head">
            <h1 id="adm-events">Події</h1>
            <button
              className="btn primary"
              type="button"
              onClick={() => {
                setNotice(null);
                setEditingId(null);
              }}
            >
              + Нова подія
            </button>
          </div>
          {notice && (
            <div className="toast" role="status">
              {notice}
            </div>
          )}
          <EventTable
            events={events}
            editingId={editingId ?? null}
            onEdit={(id) => {
              setNotice(null);
              setEditingId(id);
            }}
            onDelete={remove}
          />
        </section>
        {(editingId === null || editing) && (
          <EventForm
            key={editingId ?? 'new'}
            event={editing}
            api={api}
            onSaved={saved}
            onCancel={() => setEditingId(undefined)}
          />
        )}
      </main>
    </div>
  );
}

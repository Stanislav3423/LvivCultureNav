import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EventFull } from '@lcn/shared';
import { ApiError, adminApi, type AdminApi } from '../api.ts';

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

const isUnauthorized = (err: unknown) => err instanceof ApiError && err.status === 401;

/** Список подій або null, якщо сервер не прийняв ключ (401); інші помилки пробрасуються */
async function listOrNull(api: AdminApi): Promise<EventFull[] | null> {
  try {
    return await api.list();
  } catch (err) {
    if (isUnauthorized(err)) return null;
    throw err;
  }
}

export interface AdminSession {
  /** null — адміністратор не увійшов */
  api: AdminApi | null;
  events: EventFull[];
  login(candidate: string): Promise<boolean>;
  logout(): void;
  /** Перечитує список подій; недійсний ключ (401) завершує сесію */
  reload(): Promise<void>;
  /** Кладе збережену подію в список, не чекаючи перезавантаження */
  upsert(event: EventFull): void;
}

/** Ключ адміністратора і список подій: ключ живе у sessionStorage вкладки */
export function useAdminSession(): AdminSession {
  const [key, setKey] = useState<string | null>(readStoredKey);
  const [events, setEvents] = useState<EventFull[]>([]);
  const api = useMemo(() => (key ? adminApi(key) : null), [key]);

  const logout = useCallback(() => {
    storeKey(null);
    setKey(null);
  }, []);

  /** Свіжий список замінює поточний; null (ключ недійсний) завершує сесію */
  const applyList = useCallback(
    (list: EventFull[] | null) => {
      if (list) setEvents(list);
      else logout();
    },
    [logout],
  );

  // Ключ із sessionStorage: підвантажити події або вийти, якщо ключ уже недійсний
  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    listOrNull(api)
      .then((list) => {
        if (!cancelled) applyList(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [api, applyList]);

  async function login(candidate: string): Promise<boolean> {
    const list = await listOrNull(adminApi(candidate));
    if (!list) return false;
    setEvents(list);
    storeKey(candidate);
    setKey(candidate);
    return true;
  }

  async function reload() {
    if (api) applyList(await listOrNull(api));
  }

  function upsert(event: EventFull) {
    setEvents((list) => [...list.filter((e) => e.id !== event.id), event]);
  }

  return { api, events, login, logout, reload, upsert };
}

import { useEffect, useState } from 'react';
import type { EventView, Lang, RouteResult, TerminalId } from '@lcn/shared';
import { fetchEvents, fetchRoute } from '../api.ts';

export type LoadStatus = 'loading' | 'ready' | 'error';

export type RouteState =
  { status: 'idle' } | { status: 'loading' } | { status: 'ready'; route: RouteResult } | { status: 'error' };

/** Події потрібною мовою; зміна мови лише перезапитує контент без перезавантаження сторінки (REQ-2.2) */
export function useEvents(lang: Lang): { events: EventView[]; status: LoadStatus } {
  const [events, setEvents] = useState<EventView[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');

  useEffect(() => {
    const ctrl = new AbortController();
    fetchEvents(lang, ctrl.signal)
      .then((list) => {
        setEvents(list);
        setStatus('ready');
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setStatus('error');
      });
    return () => ctrl.abort();
  }, [lang]);

  return { events, status };
}

/** Відповідь сервера разом із запитом, якому вона належить */
interface RouteResponse {
  terminal: TerminalId;
  eventId: number;
  route?: RouteResult;
}

/**
 * Маршрут від терміналу до події (REQ-2.3); eventId = null — маршрут не потрібен.
 * Перебудовується, коли змінюється подія або термінал; відповідь на застарілий запит не показується.
 */
export function useRoute(terminal: TerminalId, eventId: number | null): RouteState {
  const [response, setResponse] = useState<RouteResponse | null>(null);

  useEffect(() => {
    if (eventId === null) return;
    const ctrl = new AbortController();
    fetchRoute(terminal, eventId, ctrl.signal)
      .then((route) => setResponse({ terminal, eventId, route }))
      .catch(() => {
        if (!ctrl.signal.aborted) setResponse({ terminal, eventId });
      });
    return () => ctrl.abort();
  }, [terminal, eventId]);

  if (eventId === null) return { status: 'idle' };
  if (response?.terminal !== terminal || response.eventId !== eventId) return { status: 'loading' };
  return response.route ? { status: 'ready', route: response.route } : { status: 'error' };
}

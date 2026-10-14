import type { EventFull, EventInput, EventView, Lang, RouteResult, TerminalId } from '@lcn/shared';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details: string[] = [],
  ) {
    super(message);
  }
}

export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? res.statusText, body.details);
  return body as T;
}

export function fetchEvents(lang: Lang, signal?: AbortSignal): Promise<EventView[]> {
  return request(`/api/events?lang=${lang}`, { signal });
}

export function fetchRoute(
  terminal: TerminalId,
  eventId: number,
  signal?: AbortSignal,
): Promise<RouteResult> {
  return request(`/api/route?terminal=${terminal}&eventId=${eventId}`, { signal });
}

/** Виклики адмін-API: ключ передається в заголовку X-Admin-Key */
export function adminApi(key: string) {
  const headers = { 'Content-Type': 'application/json', 'X-Admin-Key': key };
  return {
    list: () => request<EventFull[]>('/api/admin/events', { headers }),
    create: (input: EventInput) =>
      request<EventFull>('/api/admin/events', { method: 'POST', headers, body: JSON.stringify(input) }),
    update: (id: number, input: EventInput) =>
      request<EventFull>(`/api/admin/events/${id}`, { method: 'PUT', headers, body: JSON.stringify(input) }),
    remove: (id: number) => request<void>(`/api/admin/events/${id}`, { method: 'DELETE', headers }),
  };
}

export type AdminApi = ReturnType<typeof adminApi>;

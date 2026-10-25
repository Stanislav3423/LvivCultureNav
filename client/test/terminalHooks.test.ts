import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RouteResult, TerminalId } from '@lcn/shared';
import { useEvents, useRoute } from '../src/terminal/hooks.ts';
import { mockFetch, operaView } from './helpers.ts';

const route = (distanceMeters: number): RouteResult => ({
  mode: 'online',
  distanceMeters,
  durationMinutes: 5,
  geometry: [],
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('хуки терміналу', () => {
  it('useEvents повідомляє про помилку завантаження', async () => {
    mockFetch(() => ({ status: 503, body: { error: 'down' } }));
    const { result } = renderHook(() => useEvents('uk'));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.events).toEqual([]);
  });

  it('useEvents віддає події запитаною мовою', async () => {
    const fetch = mockFetch(() => ({ body: [operaView('en')] }));
    const { result } = renderHook(() => useEvents('en'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.events[0].title).toBe('Natalka Poltavka');
    expect(fetch.mock.calls[0][0]).toBe('/api/events?lang=en');
  });

  it('useRoute без події не ходить на сервер, а після зміни терміналу чекає нову відповідь', async () => {
    const fetch = mockFetch((url) => ({ body: route(url.includes('station') ? 2600 : 900) }));
    const { result, rerender } = renderHook(
      ({ terminal, eventId }: { terminal: TerminalId; eventId: number | null }) =>
        useRoute(terminal, eventId),
      { initialProps: { terminal: 'station', eventId: null } },
    );
    expect(result.current).toEqual({ status: 'idle' });
    expect(fetch).not.toHaveBeenCalled();

    rerender({ terminal: 'station', eventId: 1 });
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', route: route(2600) }));

    rerender({ terminal: 'center', eventId: 1 });
    expect(result.current.status).toBe('loading'); // стара відповідь (вокзал) не показується
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', route: route(900) }));
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      '/api/route?terminal=station&eventId=1',
      '/api/route?terminal=center&eventId=1',
    ]);
  });

  it('useRoute показує помилку, якщо сервер не відповів маршрутом', async () => {
    mockFetch(() => ({ status: 500, body: { error: 'Internal server error' } }));
    const { result } = renderHook(() => useRoute('station', 1));
    await waitFor(() => expect(result.current).toEqual({ status: 'error' }));
  });
});

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminSession } from '../src/admin/useAdminSession.ts';
import { mockFetch, operaFull } from './helpers.ts';

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useAdminSession', () => {
  it('входить лише з правильним ключем і кладе збережену подію в список без дубліката', async () => {
    mockFetch((_url, init) =>
      new Headers(init?.headers).get('X-Admin-Key') === 'secret'
        ? { body: [operaFull()] }
        : { status: 401, body: { error: 'Invalid admin key' } },
    );
    const { result } = renderHook(() => useAdminSession());
    expect(result.current.api).toBeNull();

    await act(async () => expect(await result.current.login('wrong')).toBe(false));
    expect(result.current.api).toBeNull();
    await act(async () => expect(await result.current.login('secret')).toBe(true));
    expect(result.current.api).not.toBeNull();
    expect(result.current.events).toHaveLength(1);

    act(() => result.current.upsert(operaFull({ startsAt: '2026-12-01T10:00' })));
    act(() => result.current.upsert(operaFull({ id: 9 })));
    expect(result.current.events.map((e) => [e.id, e.startsAt])).toEqual([
      [1, '2026-12-01T10:00'],
      [9, '2026-10-17T18:00'],
    ]);
  });

  it('завершує сесію, коли сервер перестав приймати ключ', async () => {
    sessionStorage.setItem('lcn-admin-key', 'secret');
    let valid = true;
    mockFetch(() =>
      valid ? { body: [operaFull()] } : { status: 401, body: { error: 'Invalid admin key' } },
    );
    const { result } = renderHook(() => useAdminSession());
    await waitFor(() => expect(result.current.events).toHaveLength(1));

    valid = false;
    await act(() => result.current.reload());
    expect(result.current.api).toBeNull();
    expect(sessionStorage.getItem('lcn-admin-key')).toBeNull();
  });
});

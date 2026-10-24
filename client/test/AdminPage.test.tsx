import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventFull } from '@lcn/shared';
import { AdminPage } from '../src/admin/AdminPage.tsx';
import { mockFetch, operaFull } from './helpers.ts';

const created = operaFull({
  id: 3,
  translations: { uk: { title: 'Лекція', venue: 'Музей', category: '', description: '' } },
});

// Форму з мапою замінено заглушкою: тут перевіряється логіка сторінки, а не поля форми
vi.mock('../src/admin/EventForm.tsx', () => ({
  EventForm: (props: { event?: EventFull; onSaved(e: EventFull, created: boolean): void }) => (
    <div data-testid="form">
      {props.event ? `edit:${props.event.id}` : 'new'}
      <button type="button" onClick={() => props.onSaved(props.event ?? created, !props.event)}>
        stub-save
      </button>
    </div>
  ),
}));

function api({ hangReload = false } = {}) {
  let listCalls = 0;
  return mockFetch((_url, init) => {
    if (new Headers(init?.headers).get('X-Admin-Key') !== 'secret') {
      return { status: 401, body: { error: 'Invalid admin key' } };
    }
    if (init?.method === 'DELETE') return { status: 204 };
    // повільне перезавантаження списку після збереження
    if (hangReload && ++listCalls > 1) return new Promise(() => {});
    return { body: [operaFull()] };
  });
}

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('<AdminPage> (US-07, REQ-1.1)', () => {
  it('впускає лише з правильним ключем, пам’ятає його у вкладці і забуває при виході', async () => {
    api();
    render(<AdminPage />);
    const input = screen.getByLabelText('Ключ адміністратора');
    await userEvent.type(input, 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Увійти' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Невірний ключ доступу. Спробуйте ще раз.');

    await userEvent.clear(input);
    await userEvent.type(input, 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Увійти' }));
    expect(await screen.findByRole('row', { name: /Наталка Полтавка/ })).toBeTruthy();
    expect(sessionStorage.getItem('lcn-admin-key')).toBe('secret');

    await userEvent.click(screen.getByRole('button', { name: 'Вийти' }));
    expect(screen.getByRole('button', { name: 'Увійти' })).toBeTruthy();
    expect(sessionStorage.getItem('lcn-admin-key')).toBeNull();
  });

  it('зі збереженим, але вже недійсним ключем повертає на вхід', async () => {
    sessionStorage.setItem('lcn-admin-key', 'expired');
    api();
    render(<AdminPage />);
    expect(await screen.findByRole('button', { name: 'Увійти' })).toBeTruthy();
    expect(sessionStorage.getItem('lcn-admin-key')).toBeNull();
  });

  it('після створення редагує нову подію без дубліката (регресія) і видаляє лише після підтвердження', async () => {
    sessionStorage.setItem('lcn-admin-key', 'secret');
    const fetch = api({ hangReload: true });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<AdminPage />);
    const del = await screen.findByRole('button', { name: 'Видалити «Наталка Полтавка»' });

    await userEvent.click(screen.getByRole('button', { name: '+ Нова подія' }));
    expect(screen.getByTestId('form').textContent).toContain('new');
    await userEvent.click(screen.getByRole('button', { name: 'stub-save' }));
    expect(screen.getByRole('status').textContent).toBe('Подію створено');
    expect(screen.getByTestId('form').textContent).toContain('edit:3');

    await userEvent.click(del);
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);
    await userEvent.click(del);
    expect((await screen.findByRole('status')).textContent).toBe('Подію видалено');
    expect(fetch.mock.calls.find(([, init]) => init?.method === 'DELETE')?.[0]).toBe('/api/admin/events/1');
    expect(confirm).toHaveBeenCalledTimes(2);
  });
});

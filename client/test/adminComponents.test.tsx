import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EventTable } from '../src/admin/EventTable.tsx';
import { LoginForm } from '../src/admin/LoginForm.tsx';
import { operaFull } from './helpers.ts';

describe('компоненти адмін-сторінки (US-07)', () => {
  it('<LoginForm> передає ключ і пояснює невдачі', async () => {
    const onLogin = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(true);
    render(<LoginForm onLogin={onLogin} />);
    const input = screen.getByLabelText('Ключ адміністратора');
    const submit = screen.getByRole('button', { name: 'Увійти' });

    await userEvent.type(input, 'secret');
    await userEvent.click(submit);
    expect(onLogin).toHaveBeenLastCalledWith('secret');
    expect(screen.getByRole('alert').textContent).toBe('Невірний ключ доступу. Спробуйте ще раз.');

    await userEvent.click(submit);
    expect(screen.getByRole('alert').textContent).toBe('Сервер недоступний. Спробуйте пізніше.');

    await userEvent.click(submit);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('<EventTable> показує стан перекладів, джерело і передає дії', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const event = operaFull({ source: 'partner:opera' });
    render(<EventTable events={[event]} editingId={1} onEdit={onEdit} onDelete={onDelete} />);

    const row = screen.getByRole('row', { name: /Наталка Полтавка/ });
    expect(row.className).toBe('editing');
    expect(within(row).getByText('UK').className).toBe('lc ok');
    expect(within(row).getByText('PL —').className).toBe('lc miss');
    expect(within(row).getByText('partner:opera')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Редагувати «Наталка Полтавка»' }));
    await userEvent.click(screen.getByRole('button', { name: 'Видалити «Наталка Полтавка»' }));
    expect(onEdit).toHaveBeenCalledWith(1);
    expect(onDelete).toHaveBeenCalledWith(event);
  });
});

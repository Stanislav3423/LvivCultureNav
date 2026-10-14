import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { RouteResult } from '@lcn/shared';
import { RoutePanel } from '../src/terminal/RoutePanel.tsx';

const online: RouteResult = { mode: 'online', distanceMeters: 2624, durationMinutes: 36, geometry: [] };

describe('<RoutePanel> (US-05, US-06, REQ-2.3)', () => {
  it('кнопка будує маршрут', async () => {
    const onToggle = vi.fn();
    render(<RoutePanel lang="uk" state={{ status: 'idle' }} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button', { name: 'Прокласти маршрут' }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('показує відстань і час пішки для маршруту вулицями', () => {
    render(<RoutePanel lang="uk" state={{ status: 'ready', route: online }} onToggle={() => {}} />);
    expect(screen.getByText('2,6 км · 36 хв пішки')).toBeTruthy();
    expect(screen.getByText('Пішохідний маршрут вулицями')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Сховати маршрут' })).toBeTruthy();
  });

  it('пояснює, що показано орієнтовну пряму лінію, коли сервіс недоступний', () => {
    render(
      <RoutePanel
        lang="en"
        state={{ status: 'ready', route: { ...online, mode: 'fallback' } }}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByText(/straight line shown, distance is approximate/)).toBeTruthy();
  });

  it('показує стан завантаження', () => {
    render(<RoutePanel lang="pl" state={{ status: 'loading' }} onToggle={() => {}} />);
    expect(screen.getByText('Wyznaczamy trasę…')).toBeTruthy();
  });
});

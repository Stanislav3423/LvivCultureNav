import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RouteResult } from '@lcn/shared';
import { TerminalPage } from '../src/terminal/TerminalPage.tsx';
import { fairView, mockFetch, operaView } from './helpers.ts';

// Leaflet у jsdom не малюється, тому мапу замінено заглушкою, що показує отримані пропси
vi.mock('../src/terminal/EventMap.tsx', () => ({
  EventMap: (props: { events: unknown[]; route: RouteResult | null; onSelect(id: number): void }) => (
    <div data-testid="map" data-route={props.route?.mode ?? 'none'} data-markers={props.events.length}>
      <button type="button" onClick={() => props.onSelect(2)}>
        marker-2
      </button>
    </div>
  ),
}));

const route: RouteResult = { mode: 'online', distanceMeters: 1234, durationMinutes: 16, geometry: [] };

function api(routeReply: { status?: number; body?: unknown } = { body: route }) {
  return mockFetch((url) => {
    if (url.startsWith('/api/events?lang=en')) return { body: [operaView('en'), fairView('en')] };
    if (url.startsWith('/api/events')) return { body: [operaView('uk'), fairView('uk')] };
    if (url.startsWith('/api/route')) return routeReply;
    return { status: 404 };
  });
}

const list = () => within(screen.getByRole('region', { name: /^(Події|Events)$/ }));

beforeEach(() => {
  window.history.replaceState(null, '', '/?terminal=station');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('<TerminalPage> (REQ-2.1–2.4)', () => {
  it('показує події, відкриває деталі з маркера і перемикає мову без перезавантаження', async () => {
    const fetch = api();
    render(<TerminalPage />);
    await list().findByText('«Наталка Полтавка»');
    expect(screen.getByTestId('map').dataset.markers).toBe('2');

    await userEvent.click(screen.getByRole('button', { name: 'marker-2' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Ярмарок на Ринку' })).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(await list().findByText('Natalka Poltavka')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Rynok Fair' })).toBeTruthy(); // вибір зберігся
    expect(fetch.mock.calls.map(([url]) => url)).toContain('/api/events?lang=en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('будує маршрут, перебудовує його при зміні терміналу і ховає', async () => {
    const fetch = api();
    render(<TerminalPage />);
    await userEvent.click(await list().findByRole('button', { name: /Наталка/ }));

    await userEvent.click(screen.getByRole('button', { name: 'Прокласти маршрут' }));
    expect(await screen.findByText('1,2 км · 16 хв пішки')).toBeTruthy();
    expect(screen.getByTestId('map').dataset.route).toBe('online');

    await userEvent.click(screen.getByRole('button', { name: 'Центр' }));
    await waitFor(() =>
      expect(fetch.mock.calls.map(([url]) => url)).toContain('/api/route?terminal=center&eventId=1'),
    );
    expect(window.location.search).toBe('?terminal=center');

    await userEvent.click(screen.getByRole('button', { name: 'Сховати маршрут' }));
    expect(screen.getByTestId('map').dataset.route).toBe('none');
  });

  it('повідомляє про помилки завантаження подій і маршруту', async () => {
    mockFetch(() => ({ status: 503 }));
    const { unmount } = render(<TerminalPage />);
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Не вдалося завантажити події. Перевірте з’єднання.',
    );
    unmount();

    api({ status: 500, body: { error: 'Internal server error' } });
    render(<TerminalPage />);
    await userEvent.click(await list().findByRole('button', { name: /Наталка/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Прокласти маршрут' }));
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Не вдалося побудувати маршрут. Спробуйте ще раз.',
    );
  });
});

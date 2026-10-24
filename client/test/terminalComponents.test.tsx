import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { EventView, RouteResult } from '@lcn/shared';
import { EventDetails } from '../src/terminal/EventDetails.tsx';
import { EventList } from '../src/terminal/EventList.tsx';
import { Header } from '../src/terminal/Header.tsx';
import { RoutePanel } from '../src/terminal/RoutePanel.tsx';
import { fairView, operaView } from './helpers.ts';

const arsenal: EventView = {
  id: 4,
  lang: 'en',
  title: 'Night Tour of the Arsenal',
  venue: 'Arsenal Museum',
  category: 'Tour',
  description: 'An evening walk through the city fortifications.',
  startsAt: '2026-10-20T20:00',
  lat: 49.8414,
  lng: 24.035,
  mediaUrl: null,
};

describe('компоненти терміналу', () => {
  it('<EventDetails> показує подію, попереджає про запасну мову і пропонує вибір без події (REQ-2.4)', () => {
    const { rerender } = render(<EventDetails event={arsenal} lang="en" />);
    expect(screen.getByRole('heading', { name: 'Night Tour of the Arsenal' })).toBeTruthy();
    expect(screen.getByText('Tour')).toBeTruthy();
    expect(screen.getByText('Arsenal Museum')).toBeTruthy();
    expect(screen.getByText(/20 October.*20:00/)).toBeTruthy();
    expect(screen.getByText(/city fortifications/)).toBeTruthy();
    expect(screen.queryByText(/No translation/)).toBeNull();

    rerender(<EventDetails event={arsenal} lang="pl" />);
    expect(screen.getByText('Brak tłumaczenia w tym języku — pokazano w EN')).toBeTruthy();

    rerender(<EventDetails event={null} lang="uk" />);
    expect(screen.getByText('Оберіть подію на мапі або у списку')).toBeTruthy();
  });

  it('<RoutePanel> показує стан маршруту: кнопка, завантаження, вулицями, пряма лінія (REQ-2.3)', async () => {
    const onToggle = vi.fn();
    const route: RouteResult = { mode: 'online', distanceMeters: 2624, durationMinutes: 36, geometry: [] };
    const { rerender } = render(<RoutePanel lang="uk" state={{ status: 'idle' }} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button', { name: 'Прокласти маршрут' }));
    expect(onToggle).toHaveBeenCalledOnce();

    rerender(<RoutePanel lang="pl" state={{ status: 'loading' }} onToggle={onToggle} />);
    expect(screen.getByText('Wyznaczamy trasę…')).toBeTruthy();

    rerender(<RoutePanel lang="uk" state={{ status: 'ready', route }} onToggle={onToggle} />);
    expect(screen.getByText('2,6 км · 36 хв пішки')).toBeTruthy();
    expect(screen.getByText('Пішохідний маршрут вулицями')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Сховати маршрут' })).toBeTruthy();

    rerender(
      <RoutePanel
        lang="en"
        state={{ status: 'ready', route: { ...route, mode: 'fallback' } }}
        onToggle={onToggle}
      />,
    );
    expect(screen.getByText(/straight line shown, distance is approximate/)).toBeTruthy();
  });

  it('<EventList> нумерує картки, позначає вибрану і показує помилку чи порожній список (REQ-2.1)', async () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <EventList
        events={[operaView(), fairView()]}
        lang="uk"
        selectedId={1}
        status="ready"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText('2 події')).toBeTruthy();
    const cards = screen.getAllByRole('button');
    expect(cards.map((c) => c.querySelector('.num')?.textContent)).toEqual(['1', '2']);
    expect(cards[0].getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(cards[1]);
    expect(onSelect).toHaveBeenCalledWith(2);

    rerender(<EventList events={[]} lang="en" selectedId={null} status="error" onSelect={onSelect} />);
    expect(screen.getByRole('alert').textContent).toBe('Could not load events. Check the connection.');

    rerender(<EventList events={[]} lang="pl" selectedId={null} status="ready" onSelect={onSelect} />);
    expect(screen.getByText('Brak nadchodzących wydarzeń')).toBeTruthy();
  });

  it('<Header> позначає поточну мову й термінал і передає вибір (REQ-2.2)', async () => {
    const onLang = vi.fn();
    const onTerminal = vi.fn();
    render(<Header lang="pl" terminal="center" onLang={onLang} onTerminal={onTerminal} />);
    expect(screen.getByRole('button', { name: 'PL' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Centrum' }).getAttribute('aria-pressed')).toBe('true');

    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    await userEvent.click(screen.getByRole('button', { name: 'Dworzec' }));
    expect(onLang).toHaveBeenCalledWith('en');
    expect(onTerminal).toHaveBeenCalledWith('station');
  });
});

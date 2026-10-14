import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { EventView } from '@lcn/shared';
import { EventDetails } from '../src/terminal/EventDetails.tsx';

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

describe('<EventDetails> (US-02, REQ-2.4)', () => {
  it('показує назву, категорію, місце, дату й опис події', () => {
    render(<EventDetails event={arsenal} lang="en" />);
    expect(screen.getByRole('heading', { name: 'Night Tour of the Arsenal' })).toBeTruthy();
    expect(screen.getByText('Tour')).toBeTruthy();
    expect(screen.getByText('Arsenal Museum')).toBeTruthy();
    expect(screen.getByText(/20 October.*20:00/)).toBeTruthy();
    expect(screen.getByText(/city fortifications/)).toBeTruthy();
  });

  it('попереджає, якщо контент показано запасною мовою (REQ-1.3)', () => {
    render(<EventDetails event={arsenal} lang="pl" />);
    expect(screen.getByText(/Brak tłumaczenia w tym języku — pokazano w EN/)).toBeTruthy();
  });

  it('не показує попередження, якщо мова збігається', () => {
    render(<EventDetails event={arsenal} lang="en" />);
    expect(screen.queryByText(/No translation/)).toBeNull();
  });

  it('без вибраної події пропонує обрати подію', () => {
    render(<EventDetails event={null} lang="uk" />);
    expect(screen.getByText('Оберіть подію на мапі або у списку')).toBeTruthy();
  });
});

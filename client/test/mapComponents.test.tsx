import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TERMINALS, type EventFull, type EventInput } from '@lcn/shared';
import { ApiError, type AdminApi } from '../src/api.ts';
import { EventForm } from '../src/admin/EventForm.tsx';
import { EventMap } from '../src/terminal/EventMap.tsx';
import { fairView, operaFull, operaView } from './helpers.ts';
import { fitBounds, mapHandlers } from './leafletMock.tsx';

vi.mock('react-leaflet', () => import('./leafletMock.tsx'));

const markers = () => screen.getAllByTestId('marker');

describe('компоненти з мапою (Leaflet підмінено)', () => {
  it('<EventMap> показує нумеровані маркери, «Ви тут» і лінію маршруту (REQ-2.1, REQ-2.3)', async () => {
    const onSelect = vi.fn();
    const props = {
      events: [operaView(), fairView()],
      selectedId: 2,
      terminal: TERMINALS.station,
      hereLabel: 'Ви тут',
      mapLabel: 'Мапа Львова',
      hint: 'Торкніться маркера',
      onSelect,
    };
    const { rerender } = render(<EventMap {...props} route={null} />);

    expect(markers().map((m) => m.textContent)).toEqual(['«Наталка Полтавка»', 'Ярмарок на Ринку', 'marker']);
    expect(markers()[0].dataset.html).toContain('>1<');
    expect(markers()[1].dataset.html).toContain('ev-marker sel'); // вибрана подія
    expect(markers()[2].dataset.pos).toBe(`${TERMINALS.station.lat},${TERMINALS.station.lng}`);
    expect(screen.queryByTestId('polyline')).toBeNull();
    expect(fitBounds).toHaveBeenLastCalledWith(
      expect.arrayContaining([[49.8441, 24.0262]]),
      expect.anything(),
    );

    await userEvent.click(markers()[0]);
    expect(onSelect).toHaveBeenCalledWith(1);

    const geometry: [number, number][] = [
      [49.8396, 23.9945],
      [49.8441, 24.0262],
    ];
    rerender(
      <EventMap
        {...props}
        route={{ mode: 'fallback', distanceMeters: 2400, durationMinutes: 30, geometry }}
      />,
    );
    const line = screen.getAllByTestId('polyline')[1];
    expect(line.dataset.class).toBe('route-line route-fallback');
    expect(line.dataset.dash).toBe('10 12'); // пунктир для запасного варіанта
    expect(fitBounds).toHaveBeenLastCalledWith(geometry, expect.anything());
  });

  function fakeApi(results: Array<EventFull | Error>) {
    const next = () => {
      const r = results.shift()!;
      return r instanceof Error ? Promise.reject(r) : Promise.resolve(r);
    };
    return {
      create: vi.fn((_input: EventInput) => next()),
      update: vi.fn((_id: number, _input: EventInput) => next()),
    } as unknown as AdminApi & { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  }

  it('<EventForm> створює подію з перекладами і точкою з мапи, пояснюючи помилки (REQ-1.1)', async () => {
    const saved = operaFull({ id: 9 });
    const api = fakeApi([
      new ApiError(400, 'Validation failed', ['translations.uk.title is required', 'something new']),
      new TypeError('fetch failed'),
      saved,
    ]);
    const onSaved = vi.fn();
    render(<EventForm api={api} onSaved={onSaved} onCancel={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Нова подія' })).toBeTruthy();

    const save = screen.getByRole('button', { name: 'Зберегти' });
    await userEvent.click(save);
    expect(screen.getByRole('alert').textContent).toContain('Назва українською обов’язкова');
    expect(screen.getByRole('alert').textContent).toContain('Перевірте правильність заповнення полів');

    await userEvent.type(screen.getByLabelText('Назва (UK)'), 'Лекція');
    await userEvent.type(screen.getByLabelText('Категорія (UK)'), 'Освіта');
    await userEvent.type(screen.getByLabelText('Місце (UK)'), 'Музей');
    await userEvent.type(screen.getByLabelText('Опис (UK)'), 'Про бароко');
    await userEvent.click(screen.getByRole('tab', { name: 'EN' }));
    await userEvent.type(screen.getByLabelText('Назва (EN)'), 'Lecture');
    await userEvent.type(screen.getByLabelText('Дата і час початку'), '2026-10-25T17:00');
    await userEvent.type(screen.getByLabelText('Медіа (URL зображення)'), 'https://img.test/a.jpg');
    act(() => mapHandlers.click!({ latlng: { lat: 49.841812, lng: 24.036934 } }));
    expect((screen.getByLabelText('Широта') as HTMLInputElement).value).toBe('49.84181');
    expect(screen.getByTestId('marker').dataset.pos).toBe('49.84181,24.03693');

    await userEvent.click(save);
    expect(screen.getByRole('alert').textContent).toContain('сервер недоступний');

    await userEvent.click(save);
    expect(onSaved).toHaveBeenCalledWith(saved, true);
    expect(api.create).toHaveBeenLastCalledWith({
      startsAt: '2026-10-25T17:00',
      lat: 49.84181,
      lng: 24.03693,
      mediaUrl: 'https://img.test/a.jpg',
      translations: {
        uk: { title: 'Лекція', venue: 'Музей', category: 'Освіта', description: 'Про бароко' },
        en: { title: 'Lecture', venue: '', category: '', description: '' },
        pl: { title: '', venue: '', category: '', description: '' },
      },
    });
  });

  it('<EventForm> редагує наявну подію і приховує точку без координат', async () => {
    const event = operaFull();
    const api = fakeApi([new ApiError(400, 'Validation failed'), event]);
    const onSaved = vi.fn();
    const onCancel = vi.fn();
    render(<EventForm event={event} api={api} onSaved={onSaved} onCancel={onCancel} />);

    expect(screen.getByRole('heading', { name: 'Редагування події' })).toBeTruthy();
    expect((screen.getByLabelText('Назва (UK)') as HTMLInputElement).value).toBe('Наталка Полтавка');

    await userEvent.clear(screen.getByLabelText('Широта'));
    await userEvent.clear(screen.getByLabelText('Довгота'));
    expect(screen.queryByTestId('marker')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Зберегти' }));
    expect(screen.getByRole('alert').textContent).toContain('Перевірте правильність заповнення полів');
    expect(api.update.mock.calls[0][0]).toBe(1);
    expect(Number.isNaN(api.update.mock.calls[0][1].lat)).toBe(true);

    await userEvent.type(screen.getByLabelText('Широта'), '49.8441');
    await userEvent.type(screen.getByLabelText('Довгота'), '24.0262');
    await userEvent.click(screen.getByRole('button', { name: 'Зберегти' }));
    expect(onSaved).toHaveBeenCalledWith(event, false);

    await userEvent.click(screen.getByRole('button', { name: 'Скасувати' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

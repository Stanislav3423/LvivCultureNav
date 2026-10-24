// Заглушка react-leaflet для jsdom: справжня мапа потребує браузерної верстки,
// а тут перевіряється лише те, що компонент передає мапі (маркери, лінії, обробники).
import type { ReactNode } from 'react';
import { vi } from 'vitest';

export const fitBounds = vi.fn();
export const mapHandlers: { click?: (e: { latlng: { lat: number; lng: number } }) => void } = {};

export function MapContainer({ children }: { children?: ReactNode }) {
  return <div data-testid="map-container">{children}</div>;
}

export function TileLayer() {
  return null;
}

interface MarkerProps {
  position: [number, number];
  title?: string;
  icon?: { options: { html?: unknown } };
  eventHandlers?: { click?: () => void };
}

export function Marker({ position, title, icon, eventHandlers }: MarkerProps) {
  const html = icon?.options.html;
  return (
    <button
      type="button"
      data-testid="marker"
      data-pos={position.join(',')}
      data-html={typeof html === 'string' ? html : ''}
      onClick={() => eventHandlers?.click?.()}
    >
      {title ?? 'marker'}
    </button>
  );
}

interface PolylineProps {
  positions: unknown[];
  className?: string;
  pathOptions?: { dashArray?: string };
}

export function Polyline({ positions, className, pathOptions }: PolylineProps) {
  return (
    <div
      data-testid="polyline"
      data-class={className ?? ''}
      data-dash={pathOptions?.dashArray ?? ''}
      data-points={positions.length}
    />
  );
}

export function useMap() {
  return { fitBounds };
}

export function useMapEvents(handlers: typeof mapHandlers) {
  Object.assign(mapHandlers, handlers);
  return null;
}

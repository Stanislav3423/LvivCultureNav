import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import type { EventView, LatLng, RouteResult } from '@lcn/shared';
import { LVIV_CENTER, OSM_TILES } from '../map.ts';

interface Props {
  events: EventView[];
  selectedId: number | null;
  terminal: LatLng;
  route: RouteResult | null;
  hereLabel: string;
  mapLabel: string;
  hint: string;
  onSelect(id: number): void;
}

function eventIcon(num: number, selected: boolean) {
  return L.divIcon({
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    html: `<div class="ev-marker${selected ? ' sel' : ''}">${num}</div>`,
  });
}

function hereIcon(label: string) {
  const div = document.createElement('div');
  div.className = 'you';
  div.innerHTML = '<div class="ring"></div><div class="dot"></div><div class="tag"></div>';
  div.querySelector('.tag')!.textContent = label;
  return L.divIcon({ className: '', iconSize: [24, 24], iconAnchor: [12, 12], html: div });
}

/** Підлаштовує масштаб під набір точок (усі події або маршрут), коли набір змінюється */
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = JSON.stringify(points);
  useEffect(() => {
    const pts = JSON.parse(key) as [number, number][];
    if (pts.length > 1) map.fitBounds(pts, { padding: [70, 70] });
  }, [map, key]);
  return null;
}

export function EventMap({
  events,
  selectedId,
  terminal,
  route,
  hereLabel,
  mapLabel,
  hint,
  onSelect,
}: Props) {
  const here = useMemo(() => hereIcon(hereLabel), [hereLabel]);
  const overview: [number, number][] = [
    ...events.map((e): [number, number] => [e.lat, e.lng]),
    [terminal.lat, terminal.lng],
  ];

  return (
    <section className="map-wrap" aria-label={mapLabel}>
      <MapContainer center={LVIV_CENTER} zoom={15} zoomSnap={0.25} className="map">
        <TileLayer {...OSM_TILES} />
        <FitBounds points={route ? route.geometry : overview} />
        {route && (
          <>
            <Polyline
              positions={route.geometry}
              pathOptions={{ color: '#ffffff', weight: 11, opacity: 0.9 }}
            />
            {/* className Leaflet застосовує лише при створенні шляху, тому key перестворює лінію при зміні режиму */}
            <Polyline
              key={route.mode}
              positions={route.geometry}
              className={`route-line route-${route.mode}`}
              pathOptions={{
                color: '#1c4e9a',
                weight: 6,
                dashArray: route.mode === 'fallback' ? '10 12' : undefined,
              }}
            />
          </>
        )}
        {events.map((e, i) => (
          <Marker
            key={e.id}
            position={[e.lat, e.lng]}
            icon={eventIcon(i + 1, e.id === selectedId)}
            title={e.title}
            zIndexOffset={e.id === selectedId ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(e.id) }}
          />
        ))}
        <Marker position={[terminal.lat, terminal.lng]} icon={here} interactive={false} zIndexOffset={2000} />
      </MapContainer>
      <div className="map-hint">{hint}</div>
    </section>
  );
}

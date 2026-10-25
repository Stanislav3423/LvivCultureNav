import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { OSM_TILES, RYNOK_SQUARE } from '../map.ts';

const pinIcon = L.divIcon({
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  html: '<div class="ev-marker sel pick"></div>',
});

function ClickToPick({ onPick }: { onPick(lat: number, lng: number): void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

interface Props {
  /** null — координати не задані або некоректні */
  point: [number, number] | null;
  onPick(lat: number, lng: number): void;
}

/** Вибір місця події дотиком до мапи */
export function PointPicker({ point, onPick }: Props) {
  return (
    <div className="field">
      <span className="label">Точка на мапі</span>
      <MapContainer
        center={point ?? [RYNOK_SQUARE.lat, RYNOK_SQUARE.lng]}
        zoom={14}
        className="pick-map"
        attributionControl={false}
      >
        <TileLayer url={OSM_TILES.url} maxZoom={OSM_TILES.maxZoom} />
        <ClickToPick onPick={onPick} />
        {point && <Marker position={point} icon={pinIcon} />}
      </MapContainer>
      <span className="help">Торкніться мапи, щоб обрати місце, або введіть координати</span>
    </div>
  );
}

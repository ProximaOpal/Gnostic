import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { MoneyPlace, MoneyTx } from '@/lib/money/types';
import 'leaflet/dist/leaflet.css';

function FitBounds({ places }: { places: MoneyPlace[] }) {
  const map = useMap();
  useEffect(() => {
    if (!places.length) {
      map.setView([-1.2864, 36.8172], 11);
      return;
    }
    if (places.length === 1) {
      map.setView([places[0].lat, places[0].lng], 13);
      return;
    }
    const lats = places.map((p) => p.lat);
    const lngs = places.map((p) => p.lng);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [28, 28] },
    );
  }, [places, map]);
  return null;
}

export function MoneyMap({ txs, height = 220 }: { txs: MoneyTx[]; height?: number }) {
  const places = useMemo(() => {
    const map = new Map<string, { place: MoneyPlace; count: number; spend: number }>();
    txs.forEach((t) => {
      if (!t.place) return;
      const k = `${t.place.lat.toFixed(4)},${t.place.lng.toFixed(4)}`;
      const row = map.get(k) || { place: t.place, count: 0, spend: 0 };
      row.count++;
      row.spend += t.withdrawn;
      map.set(k, row);
    });
    return [...map.values()];
  }, [txs]);

  return (
    <div className="money-map" style={{ height }}>
      <MapContainer center={[-1.2864, 36.8172]} zoom={11} style={{ height: '100%', width: '100%', borderRadius: 12 }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds places={places.map((p) => p.place)} />
        {places.map((p) => (
          <CircleMarker
            key={`${p.place.lat}-${p.place.lng}`}
            center={[p.place.lat, p.place.lng]}
            radius={Math.min(18, 6 + Math.sqrt(p.count) * 3)}
            pathOptions={{ color: '#06c97a', fillColor: '#00f78e', fillOpacity: 0.55, weight: 2 }}
          >
            <Popup>
              <strong>{p.place.name}</strong>
              <br />
              {p.count} pins · KES {Math.round(p.spend).toLocaleString()}
              <br />
              <small>{p.place.source}</small>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

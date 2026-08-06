import { useEffect, useMemo } from 'react';
import { LayerGroup, LayersControl, MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { MoneyPlace, MoneyTx } from '@/lib/money/types';
import 'leaflet/dist/leaflet.css';

function FitBounds({ places }: { places: MoneyPlace[] }) {
  const map = useMap();
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    if (!places.length) {
      map.setView([-1.2864, 36.8172], 11);
      return () => clearTimeout(t);
    }
    if (places.length === 1) {
      map.setView([places[0].lat, places[0].lng], 14);
      return () => clearTimeout(t);
    }
    const lats = places.map((p) => p.lat);
    const lngs = places.map((p) => p.lng);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [36, 36] },
    );
    return () => clearTimeout(t);
  }, [places, map]);

  useEffect(() => {
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [map]);

  return null;
}

export function MoneyMap({
  txs,
  height = 220,
  fill = false,
}: {
  txs: MoneyTx[];
  height?: number | string;
  fill?: boolean;
}) {
  const places = useMemo(() => {
    const map = new Map<string, { place: MoneyPlace; count: number; spend: number; sample?: MoneyTx }>();
    txs.forEach((t) => {
      if (!t.place) return;
      const k = `${t.place.lat.toFixed(4)},${t.place.lng.toFixed(4)}`;
      const row = map.get(k) || { place: t.place, count: 0, spend: 0, sample: t };
      row.count++;
      row.spend += t.withdrawn;
      map.set(k, row);
    });
    return [...map.values()];
  }, [txs]);

  const style = fill
    ? { height: '100%', width: '100%', minHeight: 280, borderRadius: 12 }
    : { height: typeof height === 'number' ? height : height, width: '100%', borderRadius: 12 };

  return (
    <div className={`money-map${fill ? ' is-fill' : ''}`} style={fill ? { height: '100%', minHeight: 320 } : { height }}>
      <MapContainer center={[-1.2864, 36.8172]} zoom={11} style={style} scrollWheelZoom>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite + labels">
            <LayerGroup>
              <TileLayer
                attribution="Esri World Imagery"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
              <TileLayer
                attribution="Esri Labels"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                opacity={0.95}
              />
            </LayerGroup>
          </LayersControl.BaseLayer>
        </LayersControl>
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
              <small>{p.place.source}{p.sample ? ` · ${p.sample.time.slice(0, 16).replace('T', ' ')}` : ''}</small>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

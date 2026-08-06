import type { MoneyPlace, MoneyTx } from './types';

/** Curated Kenya pins for merchants / areas seen on M-PESA statements. */
export const KENYA_PINS: { match: RegExp; place: MoneyPlace }[] = [
  { match: /kinoo|mama ngina/i, place: { name: 'Kinoo', lat: -1.2536, lng: 36.7056, source: 'pin' } },
  { match: /kikuyu/i, place: { name: 'Kikuyu', lat: -1.2464, lng: 36.6631, source: 'pin' } },
  { match: /muthiga/i, place: { name: 'Muthiga', lat: -1.2505, lng: 36.6808, source: 'pin' } },
  { match: /nyumba tatu/i, place: { name: 'Nyumba Tatu Centre', lat: -1.255, lng: 36.69, source: 'pin' } },
  { match: /westlands/i, place: { name: 'Westlands', lat: -1.267, lng: 36.812, source: 'pin' } },
  { match: /nairobi|cbd/i, place: { name: 'Nairobi CBD', lat: -1.2864, lng: 36.8172, source: 'pin' } },
  { match: /thika/i, place: { name: 'Thika', lat: -1.0333, lng: 37.0693, source: 'pin' } },
  { match: /ruiru/i, place: { name: 'Ruiru', lat: -1.148, lng: 36.96, source: 'pin' } },
  { match: /ongata|rongai/i, place: { name: 'Ongata Rongai', lat: -1.396, lng: 36.75, source: 'pin' } },
  { match: /karen/i, place: { name: 'Karen', lat: -1.319, lng: 36.71, source: 'pin' } },
  { match: /kilimani/i, place: { name: 'Kilimani', lat: -1.29, lng: 36.785, source: 'pin' } },
  { match: /lavington/i, place: { name: 'Lavington', lat: -1.28, lng: 36.76, source: 'pin' } },
  { match: /kasarani/i, place: { name: 'Kasarani', lat: -1.22, lng: 36.89, source: 'pin' } },
  { match: /embakasi/i, place: { name: 'Embakasi', lat: -1.32, lng: 36.9, source: 'pin' } },
  { match: /syokimau/i, place: { name: 'Syokimau', lat: -1.36, lng: 36.92, source: 'pin' } },
  { match: /juja/i, place: { name: 'Juja', lat: -1.1, lng: 37.01, source: 'pin' } },
  { match: /nakuru/i, place: { name: 'Nakuru', lat: -0.3031, lng: 36.08, source: 'pin' } },
  { match: /mombasa/i, place: { name: 'Mombasa', lat: -4.0435, lng: 39.6682, source: 'pin' } },
  { match: /tai'?s?\s*grill/i, place: { name: "Tai's Grill", lat: -1.2921, lng: 36.8219, source: 'pin' } },
  { match: /jaza/i, place: { name: 'Jaza Muthiga', lat: -1.2505, lng: 36.6808, source: 'pin' } },
];

const LOCATIONISH = /\b(kinoo|kikuyu|muthiga|westlands|nairobi|thika|ruiru|rongai|karen|kilimani|lavington|kasarani|embakasi|syokimau|juja|nakuru|mombasa|nyumba tatu|mama ngina|agg)\b/i;

export function looksLikeLocation(text: string): boolean {
  return LOCATIONISH.test(text) || /agent till|centre|center|opp\.|road|rd\.|street|st\.|mall|plaza/i.test(text);
}

export function pinFromText(text: string): MoneyPlace | undefined {
  for (const row of KENYA_PINS) {
    if (row.match.test(text)) return { ...row.place };
  }
  return undefined;
}

const geoCache = new Map<string, MoneyPlace | null>();

export async function nominatimSearch(query: string): Promise<MoneyPlace | null> {
  const key = query.trim().toLowerCase();
  if (!key) return null;
  if (geoCache.has(key)) return geoCache.get(key) || null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ke&q=${encodeURIComponent(query + ', Kenya')}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      geoCache.set(key, null);
      return null;
    }
    const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    if (!data?.[0]) {
      geoCache.set(key, null);
      return null;
    }
    const place: MoneyPlace = {
      name: data[0].display_name.split(',').slice(0, 2).join(',').trim(),
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      source: 'nominatim',
    };
    geoCache.set(key, place);
    return place;
  } catch {
    geoCache.set(key, null);
    return null;
  }
}

export async function enrichPlaces(txs: MoneyTx[], onProgress?: (done: number, total: number) => void): Promise<MoneyTx[]> {
  const out = [...txs];
  const unique = new Map<string, number[]>();
  out.forEach((tx, i) => {
    const pinned = pinFromText(`${tx.merchant} ${tx.details}`);
    if (pinned) {
      out[i] = { ...tx, place: pinned };
      return;
    }
    if (!looksLikeLocation(`${tx.merchant} ${tx.details}`) && !/merchant|agent|till|buy goods|pay bill/i.test(tx.details)) return;
    const q = tx.merchant.replace(/\s+via\s+.*/i, '').replace(/\s+Acc\..*/i, '').trim();
    if (q.length < 3) return;
    const list = unique.get(q) || [];
    list.push(i);
    unique.set(q, list);
  });

  const entries = [...unique.entries()];
  let done = 0;
  for (const [q, idxs] of entries) {
    const place = (await nominatimSearch(q)) || pinFromText(q);
    if (place) idxs.forEach((i) => { out[i] = { ...out[i], place }; });
    done++;
    onProgress?.(done, entries.length);
    // Nominatim usage policy: ~1 req/sec
    await new Promise((r) => setTimeout(r, 1100));
  }
  return out;
}

export function placesFromTxs(txs: MoneyTx[]): MoneyPlace[] {
  const map = new Map<string, MoneyPlace>();
  txs.forEach((t) => {
    if (!t.place) return;
    const k = `${t.place.lat.toFixed(4)},${t.place.lng.toFixed(4)}`;
    if (!map.has(k)) map.set(k, t.place);
  });
  return [...map.values()];
}

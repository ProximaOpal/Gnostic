import type { MoneyPlace, MoneyTx } from './types';

/** Explicit locality pins — only when the merchant/details text names that place. */
export const KENYA_PINS: { match: RegExp; place: MoneyPlace }[] = [
  { match: /\bkinoo\b|mama ngina/i, place: { name: 'Kinoo', lat: -1.2536, lng: 36.7056, source: 'pin' } },
  { match: /\bkikuyu\b/i, place: { name: 'Kikuyu', lat: -1.2464, lng: 36.6631, source: 'pin' } },
  { match: /\bmuthiga\b/i, place: { name: 'Muthiga', lat: -1.2505, lng: 36.6808, source: 'pin' } },
  { match: /nyumba tatu/i, place: { name: 'Nyumba Tatu Centre', lat: -1.255, lng: 36.69, source: 'pin' } },
  { match: /\bwestlands\b/i, place: { name: 'Westlands', lat: -1.267, lng: 36.812, source: 'pin' } },
  { match: /\bthika\b/i, place: { name: 'Thika', lat: -1.0333, lng: 37.0693, source: 'pin' } },
  { match: /\bruiru\b/i, place: { name: 'Ruiru', lat: -1.148, lng: 36.96, source: 'pin' } },
  { match: /ongata|rongai/i, place: { name: 'Ongata Rongai', lat: -1.396, lng: 36.75, source: 'pin' } },
  { match: /\bkaren\b/i, place: { name: 'Karen', lat: -1.319, lng: 36.71, source: 'pin' } },
  { match: /\bkilimani\b/i, place: { name: 'Kilimani', lat: -1.29, lng: 36.785, source: 'pin' } },
  { match: /\blavington\b/i, place: { name: 'Lavington', lat: -1.28, lng: 36.76, source: 'pin' } },
  { match: /\bkasarani\b/i, place: { name: 'Kasarani', lat: -1.22, lng: 36.89, source: 'pin' } },
  { match: /\bembakasi\b/i, place: { name: 'Embakasi', lat: -1.32, lng: 36.9, source: 'pin' } },
  { match: /\bsyokimau\b/i, place: { name: 'Syokimau', lat: -1.36, lng: 36.92, source: 'pin' } },
  { match: /\bjuja\b/i, place: { name: 'Juja', lat: -1.1, lng: 37.01, source: 'pin' } },
  { match: /\bnakuru\b/i, place: { name: 'Nakuru', lat: -0.3031, lng: 36.08, source: 'pin' } },
  { match: /\bmombasa\b/i, place: { name: 'Mombasa', lat: -4.0435, lng: 39.6682, source: 'pin' } },
  { match: /tai'?s?\s*grill/i, place: { name: "Tai's Grill, Nairobi", lat: -1.286389, lng: 36.817223, source: 'pin' } },
  { match: /\bjaza\b.*\bmuthiga\b|\bjaza\b/i, place: { name: 'Jaza Muthiga', lat: -1.2505, lng: 36.6808, source: 'pin' } },
];

const NAIROBI: MoneyPlace = { name: 'Nairobi metro', lat: -1.2864, lng: 36.8172, source: 'pin' };
/** ~100 km/h road travel — reject impossible same-day leaps (e.g. Kinoo → Mombasa in 2h). */
const MAX_KMH = 100;
const MINUTES_BUFFER = 20;

export function looksLikeLocation(text: string): boolean {
  return /agent till|centre|center|opp\.|road|rd\.|street|st\.|mall|plaza|kinoo|kikuyu|muthiga|westlands|thika|ruiru|rongai|karen|kilimani|nairobi|mombasa|nakuru/i.test(text);
}

export function pinFromText(text: string): MoneyPlace | undefined {
  for (const row of KENYA_PINS) {
    if (row.match.test(text)) return { ...row.place };
  }
  return undefined;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function reachableInTime(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  fromTime: string,
  toTime: string,
): boolean {
  const ms = Math.abs(new Date(toTime).getTime() - new Date(fromTime).getTime());
  if (!Number.isFinite(ms) || ms <= 0) return true;
  const hours = Math.max(ms / 3_600_000, MINUTES_BUFFER / 60);
  const km = haversineKm(from, to);
  return km <= hours * MAX_KMH;
}

function cleanMerchantQuery(merchant: string, details: string): string {
  let q = merchant
    .replace(/\s+via\s+.*/i, '')
    .replace(/\s+Acc\..*/i, '')
    .replace(/\s+Original conversation.*/i, '')
    .replace(/\bVIA KCB\b/gi, '')
    .replace(/\bvia Kopo Kopo\b/gi, '')
    .replace(/\bLimited\b/gi, '')
    .replace(/\bLTD\b/gi, '')
    .trim();
  // Prefer location phrase from agent tills
  const till = details.match(/Agent Till \d+ - (.+)$/i);
  if (till?.[1] && /kinoo|kikuyu|muthiga|centre|agg|opp/i.test(till[1])) {
    q = till[1].replace(/\s+Agg$/i, '').trim();
  }
  return q.slice(0, 80);
}

type Candidate = MoneyPlace & { score?: number };

const geoCache = new Map<string, Candidate[]>();

async function photonSearch(query: string, bias?: { lat: number; lng: number }): Promise<Candidate[]> {
  const key = `ph:${query.toLowerCase()}:${bias ? `${bias.lat.toFixed(2)},${bias.lng.toFixed(2)}` : ''}`;
  if (geoCache.has(key)) return geoCache.get(key)!;
  try {
    const params = new URLSearchParams({
      q: `${query}, Kenya`,
      limit: '8',
      lang: 'en',
    });
    // Photon public API — business / place name search
    if (bias) {
      params.set('lat', String(bias.lat));
      params.set('lon', String(bias.lng));
      params.set('location_bias_scale', '0.4');
    }
    const url = `https://photon.komoot.io/api/?${params}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      geoCache.set(key, []);
      return [];
    }
    const data = (await res.json()) as {
      features?: { geometry: { coordinates: [number, number] }; properties: Record<string, string> }[];
    };
    const out: Candidate[] = (data.features || [])
      .filter((f) => {
        const cc = (f.properties.countrycode || f.properties.country || '').toLowerCase();
        return !cc || cc === 'ke' || /kenya/i.test(f.properties.country || '');
      })
      .map((f) => {
        const [lng, lat] = f.geometry.coordinates;
        const name = [f.properties.name, f.properties.city || f.properties.county, f.properties.state]
          .filter(Boolean)
          .join(', ');
        return { name: name || query, lat, lng, source: 'photon' as const };
      })
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    geoCache.set(key, out);
    return out;
  } catch {
    geoCache.set(key, []);
    return [];
  }
}

async function nominatimSearch(query: string, bias?: { lat: number; lng: number }): Promise<Candidate[]> {
  const key = `nom:${query.toLowerCase()}:${bias ? `${bias.lat.toFixed(2)},${bias.lng.toFixed(2)}` : ''}`;
  if (geoCache.has(key)) return geoCache.get(key)!;
  try {
    const params = new URLSearchParams({
      format: 'json',
      limit: '6',
      countrycodes: 'ke',
      addressdetails: '1',
      q: `${query}, Kenya`,
    });
    if (bias) {
      // viewbox around bias ~40km
      const d = 0.35;
      params.set('viewbox', `${bias.lng - d},${bias.lat + d},${bias.lng + d},${bias.lat - d}`);
      params.set('bounded', '0');
    }
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { Accept: 'application/json', 'Accept-Language': 'en' },
    });
    if (!res.ok) {
      geoCache.set(key, []);
      return [];
    }
    const data = (await res.json()) as { lat: string; lon: string; display_name: string; type?: string; class?: string }[];
    const out: Candidate[] = (data || []).map((row) => ({
      name: row.display_name.split(',').slice(0, 3).join(',').trim(),
      lat: Number(row.lat),
      lng: Number(row.lon),
      source: 'nominatim' as const,
    }));
    geoCache.set(key, out);
    return out;
  } catch {
    geoCache.set(key, []);
    return [];
  }
}

function pickBest(
  candidates: Candidate[],
  opts: {
    query: string;
    prev?: MoneyPlace;
    prevTime?: string;
    txTime: string;
    text: string;
  },
): MoneyPlace | null {
  if (!candidates.length) return null;
  const q = opts.query.toLowerCase();
  const scored = candidates.map((c) => {
    let score = 0;
    const name = c.name.toLowerCase();
    if (name.includes(q.split(',')[0].trim().slice(0, 12))) score += 5;
    // Prefer shop/amenity-ish names over whole cities when query is a business
    if (/nairobi|mombasa|kenya$/i.test(name) && !new RegExp(name.split(',')[0], 'i').test(opts.text)) score -= 4;
    if (/\bmombasa\b/i.test(name) && !/\bmombasa\b/i.test(opts.text)) score -= 20;
    if (/\bnakuru\b/i.test(name) && !/\bnakuru\b/i.test(opts.text)) score -= 12;
    if (opts.prev) {
      const km = haversineKm(opts.prev, c);
      score -= km / 15; // closer to recent activity wins
      if (opts.prevTime && !reachableInTime(opts.prev, c, opts.prevTime, opts.txTime)) {
        score -= 50;
      }
    } else {
      // Default anchor Nairobi metro if no history
      const km = haversineKm(NAIROBI, c);
      if (km > 80 && !LOCATIONISH_FAR.test(opts.text)) score -= 15;
    }
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score < -30) return null;
  if (opts.prev && opts.prevTime && !reachableInTime(opts.prev, best.c, opts.prevTime, opts.txTime)) {
    const local = scored.find((s) => reachableInTime(opts.prev!, s.c, opts.prevTime!, opts.txTime));
    if (local) return { ...local.c, source: local.c.source === 'photon' ? 'photon' : 'nominatim' };
    // Impossible leap — keep previous cluster (don't teleport to Mombasa)
    return { ...opts.prev, name: `${opts.prev.name} (biased)`, source: 'biased' };
  }
  return best.c;
}

const LOCATIONISH_FAR = /\bmombasa\b|\bnakuru\b|\bkisumu\b|\beldoret\b/i;

async function resolvePlace(
  query: string,
  text: string,
  txTime: string,
  prev?: MoneyPlace,
  prevTime?: string,
): Promise<MoneyPlace | null> {
  const pinned = pinFromText(text);
  if (pinned) {
    if (prev && prevTime && !reachableInTime(prev, pinned, prevTime, txTime) && !pinFromText(text)?.name.includes(pinned.name)) {
      // Explicit place in text still wins if named; else reject far pin
      if (!new RegExp(pinned.name.split(',')[0], 'i').test(text)) {
        return { ...prev, source: 'biased' };
      }
    }
    if (prev && prevTime && !reachableInTime(prev, pinned, prevTime, txTime)) {
      // Named far city in text but unreachable in time — keep local bias
      return { ...prev, name: `${prev.name} (time-check)`, source: 'biased' };
    }
    return pinned;
  }

  const bias = prev || NAIROBI;
  let candidates = await photonSearch(query, bias);
  if (!candidates.length) candidates = await nominatimSearch(query, bias);
  else {
    const extra = await nominatimSearch(query, bias);
    candidates = [...candidates, ...extra];
  }
  return pickBest(candidates, { query, prev, prevTime, txTime, text });
}

/** Geocode merchants chronologically with travel-time sanity checks. */
export async function enrichPlaces(txs: MoneyTx[], onProgress?: (done: number, total: number) => void): Promise<MoneyTx[]> {
  const out = txs.map((t) => ({ ...t }));
  const chrono = [...out.keys()].sort((a, b) => out[a].time.localeCompare(out[b].time));

  let prev: MoneyPlace | undefined;
  let prevTime: string | undefined;
  let done = 0;
  const total = chrono.length;

  for (const i of chrono) {
    const tx = out[i];
    const text = `${tx.merchant} ${tx.details}`;
    const shouldGeo =
      looksLikeLocation(text) ||
      /merchant|agent|till|buy goods|pay bill|payment to small business/i.test(tx.details);

    if (!shouldGeo || /charge|overdraft of credit|fuliza|salary payment|funds received/i.test(tx.details)) {
      done++;
      onProgress?.(done, total);
      continue;
    }

    const q = cleanMerchantQuery(tx.merchant, tx.details);
    if (q.length < 3) {
      done++;
      onProgress?.(done, total);
      continue;
    }

    const place = await resolvePlace(q, text, tx.time, prev, prevTime);
    if (place) {
      out[i] = { ...tx, place };
      // Only advance trajectory for concrete (non-virtual) pins
      if (place.source !== 'biased') {
        prev = place;
        prevTime = tx.time;
      }
    }

    done++;
    onProgress?.(done, total);
    await new Promise((r) => setTimeout(r, 900));
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

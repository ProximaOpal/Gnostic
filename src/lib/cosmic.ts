const CHALDEAN: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:8,G:3,H:5,I:1,J:1,K:2,L:3,M:4,N:5,O:7,P:8,Q:1,R:2,S:3,T:4,U:6,V:6,W:6,X:5,Y:1,Z:7,
};

export const NUM_MEANINGS: Record<number, { name: string; desc: string }> = {
  1: { name: 'The Sun', desc: 'Leadership, independence, beginnings.' },
  2: { name: 'The Moon', desc: 'Sensitivity, cooperation, polarity.' },
  3: { name: 'Jupiter', desc: 'Creativity, expression, Trinity.' },
  4: { name: 'Uranus', desc: 'Building, stability, the square.' },
  5: { name: 'Mercury', desc: 'Freedom, communication, change.' },
  6: { name: 'Venus', desc: 'Love, responsibility, harmony.' },
  7: { name: 'Neptune', desc: 'Mysticism, initiation, the veil.' },
  8: { name: 'Saturn', desc: 'Power, karma, material mastery.' },
  9: { name: 'Mars', desc: 'Completion, service — sacred in Chaldean.' },
  11: { name: 'The Awakener', desc: 'Master number — illumination.' },
  22: { name: 'Master Builder', desc: 'Master number — grand vision.' },
  33: { name: 'Master Teacher', desc: 'Master number — Christic service.' },
};

export const PLANETS = [
  { name: 'Sun', emoji: '☀️', day: 'Sunday', quality: 'Will, consciousness, solar force' },
  { name: 'Moon', emoji: '🌙', day: 'Monday', quality: 'Reflection, dreams, cycles' },
  { name: 'Mars', emoji: '♂️', day: 'Tuesday', quality: 'Force, courage, sexual energy' },
  { name: 'Mercury', emoji: '☿', day: 'Wednesday', quality: 'Mind, communication, duality' },
  { name: 'Jupiter', emoji: '♃', day: 'Thursday', quality: 'Expansion, wisdom, grace' },
  { name: 'Venus', emoji: '♀️', day: 'Friday', quality: 'Love, beauty, sacred feminine' },
  { name: 'Saturn', emoji: '♄', day: 'Saturday', quality: 'Karma, discipline, initiation' },
];

export const TAROT = [
  { n:0, name:'The Fool', emoji:'🃏', key:'Aleph', planet:'Uranus', desc:'Spirit before manifestation.', interp:'Leap of faith. Be innocent of ego.' },
  { n:1, name:'The Magician', emoji:'⚗️', key:'Beth', planet:'Mercury', desc:'Conscious will.', interp:'Channel Above to Below.' },
  { n:2, name:'High Priestess', emoji:'🌙', key:'Gimel', planet:'Moon', desc:'Divine Mother. Intuition.', interp:'Enter silence. Trust intuition.' },
  { n:3, name:'The Empress', emoji:'🌿', key:'Daleth', planet:'Venus', desc:'Abundance. Cosmic womb.', interp:'Nourish and create.' },
  { n:4, name:'The Emperor', emoji:'👑', key:'Heh', planet:'Aries', desc:'Will, structure.', interp:'Lead yourself with discipline.' },
  { n:5, name:'The Hierophant', emoji:'🗝️', key:'Vau', planet:'Taurus', desc:'Initiation. Inner Master.', interp:'Return to lineage of study.' },
  { n:6, name:'The Lovers', emoji:'💫', key:'Zayin', planet:'Gemini', desc:'Polarity. Alchemy.', interp:'Transmute sexual energy.' },
  { n:7, name:'The Chariot', emoji:'⚔️', key:'Cheth', planet:'Cancer', desc:'Victory through will.', interp:'Consciousness holds the reins.' },
  { n:8, name:'Strength', emoji:'🦁', key:'Teth', planet:'Leo', desc:'Taming the beast.', interp:'Lust tamed by love and patience.' },
  { n:9, name:'The Hermit', emoji:'🕯️', key:'Yod', planet:'Virgo', desc:'Inner light.', interp:'Retreat. Isolation from noise.' },
  { n:10, name:'Wheel of Fortune', emoji:'🎡', key:'Kaph', planet:'Jupiter', desc:'Cycles. Karma.', interp:'Accept with equanimity.' },
  { n:11, name:'Justice', emoji:'⚖️', key:'Lamed', planet:'Libra', desc:'Cause and effect.', interp:'Observe your causes today.' },
  { n:12, name:'The Hanged Man', emoji:'🔮', key:'Mem', planet:'Neptune', desc:'Surrender.', interp:'Die to personality.' },
  { n:13, name:'Death', emoji:'💀', key:'Nun', planet:'Scorpio', desc:'Transformation.', interp:'What ego-structures must die?' },
  { n:14, name:'Temperance', emoji:'🏹', key:'Samekh', planet:'Sagittarius', desc:'Alchemy. Solar force.', interp:'Transmute into Christic force.' },
  { n:15, name:'The Devil', emoji:'🐐', key:'Ayin', planet:'Capricorn', desc:'Ego. Bondage.', interp:'Observe without identification.' },
  { n:16, name:'The Tower', emoji:'⚡', key:'Peh', planet:'Mars', desc:'False structures fall.', interp:'Surrender to disintegration.' },
  { n:17, name:'The Star', emoji:'⭐', key:'Tzaddi', planet:'Aquarius', desc:'Hope. Renewal.', interp:'Bathe in cosmic waters.' },
  { n:18, name:'The Moon', emoji:'🌕', key:'Qoph', planet:'Pisces', desc:'Subconscious.', interp:'Observe dreams carefully.' },
  { n:19, name:'The Sun', emoji:'☀️', key:'Resh', planet:'Sun', desc:'Christic solar force.', interp:'Radiate when ego is quiet.' },
  { n:20, name:'Judgement', emoji:'📯', key:'Shin', planet:'Pluto', desc:'Call to awakening.', interp:'Respond with commitment.' },
  { n:21, name:'The World', emoji:'🌍', key:'Tau', planet:'Saturn', desc:'Completion.', interp:'Integrate every experience.' },
];

export const LIFE_STAGES = [
  { years: [0,7] as const, name: 'Lunar Childhood', desc: 'Etheric formation.' },
  { years: [7,14] as const, name: 'Moon–Mercury', desc: 'Astral body awakens.' },
  { years: [14,21] as const, name: 'Venus Adolescence', desc: 'Desire forces arise.' },
  { years: [21,28] as const, name: 'Solar Maturity', desc: 'The I takes possession.' },
  { years: [28,35] as const, name: 'Mars Activation', desc: 'Will and conflict peak.' },
  { years: [35,42] as const, name: 'Jupiter Expansion', desc: 'Wisdom through experience.' },
  { years: [42,49] as const, name: 'Saturn Reckoning', desc: 'Karmic accounting.' },
  { years: [49,56] as const, name: 'Uranus Awakening', desc: 'Second birth of the soul.' },
  { years: [56,63] as const, name: 'Neptune Dissolving', desc: 'Ego structures dissolve.' },
  { years: [63,70] as const, name: 'Pluto Integration', desc: 'Death as transformation.' },
  { years: [70,99] as const, name: 'Cosmic Completion', desc: 'Return to Source.' },
];

export const PSYCH_TYPES: Record<string, string> = {
  Intellectual: 'The dry mind that escapes feeling. Must learn to feel.',
  Emotional: 'Dominated by feeling. Must use the mind as a sword.',
  Instinctual: 'Governed by impulse. Transmute instinct consciously.',
  Motor: 'Governed by movement. Develop inner stillness.',
  Sexual: 'Sexual centre dominates — curse and alchemical resource.',
};

function chaldeanReduce(n: number) {
  while (n > 9 && ![11, 22, 33].includes(n)) n = String(n).split('').reduce((s, c) => s + parseInt(c), 0);
  return n;
}

function chaldeanName(name: string) {
  return name.toUpperCase().replace(/[^A-Z]/g, '').split('').reduce((s, c) => s + (CHALDEAN[c] || 0), 0);
}

export function calcNumerology(dob?: string, name?: string, activeDate = new Date()) {
  if (!dob) return {} as Record<string, number>;
  const [y, m, d] = dob.split('-').map(Number);
  const lifePath = chaldeanReduce(y + m + d);
  const destiny = chaldeanReduce(chaldeanName(name || ''));
  const vowels = (name || '').toUpperCase().replace(/[^AEIOU]/g, '').split('').reduce((s, c) => s + (CHALDEAN[c] || 0), 0);
  const soul = chaldeanReduce(vowels);
  const personalYear = chaldeanReduce(m + d + activeDate.getFullYear());
  const personalMonth = chaldeanReduce(personalYear + (activeDate.getMonth() + 1));
  const personalDay = chaldeanReduce(personalYear + (activeDate.getMonth() + 1) + activeDate.getDate());
  return { lifePath, destiny, soul, personalYear, personalMonth, personalDay };
}

export function getAge(dob?: string, on = new Date()) {
  if (!dob) return null;
  const [y, m, d] = dob.split('-').map(Number);
  let age = on.getFullYear() - y;
  if (on.getMonth() + 1 < m || (on.getMonth() + 1 === m && on.getDate() < d)) age--;
  return age;
}

export function getDailyTarot(dob?: string, name?: string, dt = new Date()) {
  const num = calcNumerology(dob, name, dt);
  const pd = num.personalDay || ((dt.getDate() + dt.getMonth() + 1 + dt.getFullYear()) % 22);
  const universal = (dt.getDate() + dt.getMonth() + 1 + dt.getFullYear()) % 22;
  const dailyIdx = Math.abs(pd + universal) % 22;
  return { primary: TAROT[dailyIdx], secondary: TAROT[(dailyIdx + dt.getDay()) % 22] };
}

export function getDayRuler(dt = new Date()) {
  return PLANETS[dt.getDay()];
}

export function getPlanetaryHour(dt = new Date()) {
  const order = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
  const dayIdx = PLANETS.findIndex((p) => p.day === ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dt.getDay()]);
  const planet = order[(dayIdx + dt.getHours()) % 7];
  return PLANETS.find((p) => p.name === planet) || PLANETS[0];
}

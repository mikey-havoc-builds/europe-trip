/* Europe Trip Planner – single-page iPhone web app. Data: encrypted itinerary + on-device additions. */
{
'use strict';
const VERSION = '1.2.0';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '';
const pad = n => String(n).padStart(2, '0');
const LS = {
  get(k, d) { try { const v = localStorage.getItem('tp.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('tp.' + k, JSON.stringify(v)); } catch (e) { console.warn('storage', e); } },
  del(k) { try { localStorage.removeItem('tp.' + k); } catch {} }
};

/* ---------- icons ---------- */
const P = d => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
const IC = {
  flight: P('M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z'),
  bus: P('M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM18 11H6V6h12z'),
  train: P('M12 2c-4 0-8 .5-8 4v9.5A3.5 3.5 0 0 0 7.5 19L6 20.5v.5h2.2l2-2H14l2 2h2v-.5L16.5 19a3.5 3.5 0 0 0 3.5-3.5V6c0-3.5-3.6-4-8-4zM7.5 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3.5-7H6V6h5zm2 0V6h5v4zm3.5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z'),
  stay: P('M7 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9a4 4 0 0 0-4-4z'),
  sight: P('M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z'),
  event: P('M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4a2 2 0 0 1 0 4v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 1 0-4zm-9 7.5h-2v-2h2zm0-4.5h-2v-2h2zm0-4.5h-2v-2h2z'),
  food: P('M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z'),
  other: P('M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z'),
  walk: P('M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9.8 8.9 7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3A7.3 7.3 0 0 0 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6a2 2 0 0 0-2.5-.8L6 8.3V13h2V9.6z'),
  car: P('M18.9 6c-.2-.6-.8-1-1.4-1h-11c-.7 0-1.2.4-1.4 1L3 12v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8zM6.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 11l1.5-4.5h11L19 11z'),
  back: P('M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z'),
  next: P('M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z'),
  plus: P('M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z'),
  gear: P('M19.1 12.9a7 7 0 0 0 0-1.8l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.5-.9L14.8 3h-4l-.4 2.5a7 7 0 0 0-1.5.9l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 1.8l-2 1.6 2 3.4 2.4-1c.5.4 1 .7 1.5.9l.4 2.5h4l.4-2.5c.5-.2 1-.5 1.5-.9l2.4 1 2-3.4zM12.8 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z'),
  loc: P('M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.9 3A9 9 0 0 0 13 3.1V1h-2v2.1A9 9 0 0 0 3.1 11H1v2h2.1a9 9 0 0 0 7.9 7.9V23h2v-2.1a9 9 0 0 0 7.9-7.9H23v-2zM12 19a7 7 0 1 1 0-14 7 7 0 0 1 0 14z'),
  today: P('M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14zM7 12h5v5H7z')
};
IC.transit = IC.train; IC.plan = IC.sight;
const TYPES = {flight:'Flight', train:'Train', bus:'Bus', stay:'Stay', sight:'Sightseeing', event:'Tickets / event', food:'Food & drink', other:'Other'};
const JOURNEY = new Set(['flight', 'bus', 'train']);
const tcls = t => 't-' + (t === 'plan' ? 'sight' : (TYPES[t] ? t : 'other'));

/* ---------- dates ---------- */
const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], WDL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], MOL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const dp = s => { const [y, m, d] = s.split('-').map(Number); return {y, m, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay()}; };
const addDays = (s, n) => { const {y, m, d} = dp(s); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const dayDiff = (a, b) => { const A = dp(a), B = dp(b); return Math.round((Date.UTC(B.y, B.m - 1, B.d) - Date.UTC(A.y, A.m - 1, A.d)) / 864e5); };
const fmtD = s => { const p = dp(s); return `${WD[p.wd]} ${p.d} ${MO[p.m - 1]}`; };
const fmtDL = s => { const p = dp(s); return `${WDL[p.wd]} ${p.d} ${MOL[p.m - 1]} ${p.y}`; };
const today = () => { const t = new Date(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; };
const minus = (time, mins) => { if (!time) return ''; let [h, m] = time.split(':').map(Number); let t = h * 60 + m - mins, prev = t < 0; t = (t + 1440) % 1440; return `${pad(Math.floor(t / 60))}:${pad(t % 60)}${prev ? ' (day before)' : ''}`; };
const ago = ts => { if (!ts) return 'never'; const m = Math.round((Date.now() - ts) / 6e4); if (m < 1) return 'just now'; if (m < 60) return m + ' min ago'; const h = Math.round(m / 60); if (h < 48) return h + ' h ago'; return Math.round(h / 24) + ' days ago'; };

/* ---------- geo ---------- */
const CITIES = [['London',51.507,-0.128],['Frankfurt',50.11,8.682],['Paris',48.857,2.352],['Lyon',45.764,4.836],['Barcelona',41.387,2.17],['Venice',45.44,12.316],['Florence',43.77,11.256],['Rome',41.9,12.496],['Athens',37.984,23.728],['Singapore',1.352,103.82],['Christchurch',-43.532,172.636]];
const hav = (a, b) => { const R = 6371, r = x => x * Math.PI / 180; const dl = r(b.lat - a.lat), dn = r(b.lon - a.lon); const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const hasLL = p => p && typeof p.lat === 'number' && typeof p.lon === 'number';
function cityOf(p) {
  if (!p) return '';
  if (hasLL(p)) { let best = null, bd = 1e9; for (const c of CITIES) { const d = hav(p, {lat: c[1], lon: c[2]}); if (d < bd) { bd = d; best = c[0]; } } if (bd < 75) return best; }
  const parts = (p.addr || '').split(',').map(s => s.trim().replace(/^\d{4,5}\s*/, '')).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 2] : (p.name || '');
}

/* ---------- state ---------- */
const S = {
  base: LS.get('base', null), pass: LS.get('pass', ''),
  user: LS.get('user', {added: [], edits: {}, hidden: []}),
  cache: LS.get('cache', {wiki: {}, hours: {}, geo: {}, wx: {}}),
  prefs: LS.get('prefs', {auto: true, lastSync: 0, locOK: false}),
  pos: null, lastDay: null, syncing: false, maps: []
};
for (const k of ['wiki', 'hours', 'geo', 'wx']) S.cache[k] = S.cache[k] || {};
const saveUser = () => LS.set('user', S.user), saveCache = () => LS.set('cache', S.cache), savePrefs = () => LS.set('prefs', S.prefs);

function normalise(base) {
  const out = [];
  for (const i of base.items || []) {
    const n = {...i};
    if (JOURNEY.has(i.type)) { n.endDate = i.arrDate; n.endTime = i.arrTime; n.endTz = i.arrTz; }
    else { n.endDate = i.date; n.endTime = i.end || ''; }
    delete n.arrDate; delete n.arrTime; delete n.arrTz; delete n.end;
    out.push(n);
  }
  for (const s of base.stays || []) out.push({id: s.id, type: 'stay', title: s.name, city: s.city, date: s.inDate, time: s.inTime || '', endDate: s.outDate, endTime: s.outTime || '', tz: s.tz,
    place: {name: s.name, addr: s.addr || '', lat: s.lat, lon: s.lon, osm: s.osm}, conf: s.conf, phone: s.phone, website: s.website, notes: s.notes,
    details: s.cost ? {'Total cost': s.cost} : undefined});
  for (const p of base.plans || []) out.push({id: 'p-' + p.date, type: 'plan', date: p.date, city: p.city, text: p.text,
    stops: (p.places || []).map(a => ({name: a[0], lat: a[1], lon: a[2], wiki: a[3] || null, osm: a[4] || null}))});
  return out;
}
let ITEMS = [];
function rebuild() {
  const hidden = new Set(S.user.hidden || []);
  ITEMS = normalise(S.base).filter(i => !hidden.has(i.id)).map(i => S.user.edits[i.id] ? {...i, ...S.user.edits[i.id], id: i.id} : i)
    .concat((S.user.added || []).filter(i => !hidden.has(i.id)));
}
const byId = id => ITEMS.find(i => i.id === id);
function placeOf(i) { return JOURNEY.has(i.type) ? i.from : i.place; }
function allPlaces(i) {
  if (JOURNEY.has(i.type)) return [i.from, i.to].filter(Boolean);
  if (i.type === 'plan') return i.stops || [];
  return i.place ? [i.place] : [];
}
function stopItem(plan, idx) {
  const s = plan.stops[idx];
  return {id: `${plan.id}-${idx}`, type: 'sight', title: s.name, date: plan.date, place: s, stop: true, planId: plan.id, city: plan.city};
}
const shortName = p => p ? (p.code || (p.name || '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/ (Bus Station|Bus station|Central Station)$/, '').trim()) : '';
function titleOf(i) {
  if (JOURNEY.has(i.type)) return i.title || `${i.number || TYPES[i.type]} · ${shortName(i.from)} → ${shortName(i.to)}`;
  if (i.type === 'plan') return 'Sightseeing';
  return i.title || (i.place && i.place.name) || TYPES[i.type] || 'Activity';
}

/* ---------- calendar model ---------- */
function tripRange() {
  let s = S.base.trip.start, e = S.base.trip.end;
  for (const i of ITEMS) { if (i.date && i.date < s) s = i.date; const ed = i.endDate || i.date; if (ed && ed > e) e = ed; }
  return [s, e];
}
function entriesFor(d) {
  const out = [];
  for (const i of ITEMS) {
    if (i.type === 'plan') { if (i.date === d) out.push({i, role: 'plan', t: ''}); continue; }
    if (i.date === d) out.push({i, role: i.type === 'stay' ? 'in' : 'start', t: i.time || ''});
    if (i.endDate && i.endDate !== i.date && i.endDate === d) {
      if (i.type === 'stay') out.push({i, role: 'out', t: i.endTime || ''});
      else if (JOURNEY.has(i.type)) out.push({i, role: 'arr', t: i.endTime || ''});
    }
  }
  const rank = e => e.role === 'plan' ? '' : (e.t || '99:99');
  return out.sort((a, b) => rank(a) < rank(b) ? -1 : rank(a) > rank(b) ? 1 : 0);
}
function nightOf(d) {
  const stay = ITEMS.find(i => i.type === 'stay' && i.date <= d && (i.endDate || i.date) > d);
  if (stay) return {kind: 'stay', i: stay};
  const ov = ITEMS.find(i => JOURNEY.has(i.type) && i.date <= d && (i.endDate || i.date) > d);
  if (ov) return {kind: 'travel', i: ov};
  return null;
}
function cityFor(d, prev) {
  const js = ITEMS.filter(i => JOURNEY.has(i.type) && i.date === d).sort((a, b) => (a.time || '') < (b.time || '') ? -1 : 1);
  if (js.length) {
    const chain = [cityOf(js[0].from)]; for (const j of js) { const c = cityOf(j.to); if (c && c !== chain[chain.length - 1]) chain.push(c); }
    if (chain.length > 1) return chain.join(' → ');
  }
  const plan = ITEMS.find(i => i.type === 'plan' && i.date === d); if (plan && plan.city) return plan.city;
  const n = nightOf(d); if (n && n.kind === 'stay') return n.i.city || cityOf(n.i.place);
  const arr = ITEMS.find(i => JOURNEY.has(i.type) && i.endDate === d); if (arr) return cityOf(arr.to);
  return prev || '';
}
function chipInfo(e) {
  const i = e.i, plus = (i.endDate && i.endDate > i.date) ? ` +${dayDiff(i.date, i.endDate)}` : '';
  if (e.role === 'plan') return {l1: `Sightseeing${i.stops && i.stops.length ? ` · ${i.stops.length} stops` : ''}`, l2: i.text};
  if (JOURNEY.has(i.type)) {
    if (e.role === 'arr') return {l1: `Arrive ${shortName(i.to)}`, l2: `<span class="tm">Arr ${esc(i.endTime)}</span> · ${esc(i.number || TYPES[i.type])} from ${esc(shortName(i.from))}`, raw: true};
    return {l1: titleOf(i), l2: `<span class="tm">Dep ${esc(i.time)}</span>${i.endTime ? ` · <span class="tm">Arr ${esc(i.endTime)}${plus}</span>` : ''}${i.terminal ? ' · ' + esc(i.terminal) : ''}`, raw: true};
  }
  if (i.type === 'stay') {
    const nights = dayDiff(i.date, i.endDate || i.date);
    if (e.role === 'out') return {l1: `Check out · ${titleOf(i)}`, l2: i.endTime ? `By ${i.endTime}` : ''};
    return {l1: `Check in · ${titleOf(i)}`, l2: `${i.time ? 'From ' + i.time + ' · ' : ''}${nights} night${nights === 1 ? '' : 's'}`};
  }
  const pl = i.place && i.place.name && i.place.name !== i.title ? i.place.name : '';
  return {l1: `${i.time ? i.time + ' ' : ''}${titleOf(i)}`, l2: [pl, i.endTime ? 'until ' + i.endTime : ''].filter(Boolean).join(' · ')};
}

/* ---------- live data ---------- */
async function getJSON(url, opt = {}, ms = 12000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(url, {...opt, signal: c.signal}); if (!r.ok) throw new Error(r.status); return await r.json(); } finally { clearTimeout(t); }
}
async function wiki(title) {
  if (!title) return null;
  const c = S.cache.wiki[title]; if (c && Date.now() - c.ts < 14 * 864e5) return c;
  if (!navigator.onLine) return c || null;
  try {
    const j = await getJSON('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title));
    const v = {ts: Date.now(), extract: j.extract || '', img: j.thumbnail && j.thumbnail.source || '', url: j.content_urls && j.content_urls.mobile && j.content_urls.mobile.page || ''};
    S.cache.wiki[title] = v; saveCache(); return v;
  } catch { return c || null; }
}
const hkey = p => `${(p.osm || p.name || '').toLowerCase()}@${(+p.lat).toFixed(3)},${(+p.lon).toFixed(3)}`;
async function hours(p, force) {
  if (!hasLL(p)) return null;
  const k = hkey(p), c = S.cache.hours[k];
  if (c && !force && Date.now() - c.ts < 7 * 864e5) return c;
  if (!navigator.onLine) return c || null;
  const word = (p.osm || p.name || '').replace(/\(.*?\)/g, '').split(/[,–-]/)[0].trim().replace(/[.*+?^${}()|[\]\\"]/g, '.');
  const q = `[out:json][timeout:20];nwr(around:300,${p.lat},${p.lon})["opening_hours"]["name"~"${word}",i];out tags 5;`;
  try {
    const j = await getJSON('https://overpass-api.de/api/interpreter', {method: 'POST', body: 'data=' + encodeURIComponent(q), headers: {'Content-Type': 'application/x-www-form-urlencoded'}}, 25000);
    const el = (j.elements || [])[0];
    const v = {ts: Date.now(), oh: el ? el.tags.opening_hours : '', name: el ? el.tags.name : '', web: el ? (el.tags.website || el.tags['contact:website'] || '') : '', phone: el ? (el.tags.phone || el.tags['contact:phone'] || '') : ''};
    S.cache.hours[k] = v; saveCache(); return v;
  } catch { return c || null; }
}
function ohFor(oh, date) {
  if (!oh) return null; if (oh.trim() === '24/7') return '24 hours';
  const p = dp(date), wd = (p.wd + 6) % 7, mo = p.m - 1;
  const DN = ['Mo','Tu','We','Th','Fr','Sa','Su'], MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const expand = (spec, list) => { const s = new Set(); for (const part of spec.split(',')) { const [a, b] = part.trim().split('-').map(x => list.indexOf(x.trim().slice(0, 2 + (list === MN ? 1 : 0)))); if (a < 0) continue; if (b < 0 || b === undefined) { s.add(a); continue; } for (let k = a; ; k = (k + 1) % list.length) { s.add(k); if (k === b) break; } } return s; };
  let res = null;
  for (let rule of oh.split(';')) {
    rule = rule.trim(); if (!rule || /^(PH|SH)\b/.test(rule)) continue;
    const mm = rule.match(/^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w\s,-]*?)\s+(?=Mo|Tu|We|Th|Fr|Sa|Su|\d|off|closed)/);
    if (mm) { if (!expand(mm[1].replace(/\s?\d{1,2}/g, ''), MN).has(mo)) continue; rule = rule.slice(mm[0].length); }
    let days = null; const dm = rule.match(/^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?,?)+)(?:,PH)?\s*(.*)$/);
    if (dm) { days = expand(dm[1], DN); rule = dm[2]; }
    if (days && !days.has(wd)) continue;
    rule = rule.replace(/"[^"]*"/g, '').trim();
    if (/^(off|closed)/i.test(rule)) res = 'Closed';
    else if (/\d{1,2}:\d{2}/.test(rule)) res = rule.replace(/(\d)-(\d)/g, '$1–$2').replace(/,\s*/g, ', ');
  }
  return res;
}
async function geocode(q) {
  if (!q || /TBC/i.test(q)) return null;
  const k = q.toLowerCase(); if (S.cache.geo[k]) return S.cache.geo[k];
  if (!navigator.onLine) return null;
  try {
    const j = await getJSON('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=' + encodeURIComponent(q), {headers: {'Accept-Language': 'en'}});
    if (!j[0]) return null; const v = {lat: +j[0].lat, lon: +j[0].lon}; S.cache.geo[k] = v; saveCache(); return v;
  } catch { return null; }
}
const WMO = {0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Fog',51:'Light drizzle',53:'Drizzle',55:'Drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',66:'Freezing rain',67:'Freezing rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Showers',81:'Showers',82:'Heavy showers',85:'Snow showers',86:'Snow showers',95:'Thunderstorm',96:'Thunderstorm',99:'Thunderstorm'};
async function weather(city, date) {
  const c = CITIES.find(x => city && city.split(' → ').pop() === x[0]); if (!c) return null;
  const k = c[0], cc = S.cache.wx[k];
  if (!(cc && Date.now() - cc.ts < 3 * 3600e3) && navigator.onLine) {
    try {
      const j = await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${c[1]}&longitude=${c[2]}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=16`);
      S.cache.wx[k] = {ts: Date.now(), d: j.daily}; saveCache();
    } catch {}
  }
  const w = S.cache.wx[k]; if (!w) return null;
  const ix = w.d.time.indexOf(date); if (ix < 0) return null;
  return `${WMO[w.d.weather_code[ix]] || ''} · ${Math.round(w.d.temperature_2m_min[ix])}–${Math.round(w.d.temperature_2m_max[ix])}°C${w.d.precipitation_probability_max[ix] != null ? ` · ${w.d.precipitation_probability_max[ix]}% rain` : ''}`;
}

/* ---------- location & travel times ---------- */
function locate(ask) {
  return new Promise(res => {
    if (!navigator.geolocation || (!ask && !S.prefs.locOK)) return res(S.pos);
    navigator.geolocation.getCurrentPosition(p => { S.pos = {lat: p.coords.latitude, lon: p.coords.longitude, ts: Date.now()}; S.prefs.locOK = true; savePrefs(); res(S.pos); },
      () => res(S.pos), {enableHighAccuracy: false, timeout: 10000, maximumAge: 60000});
  });
}
function estimate(dkm, walkS, carS) {
  const walk = walkS != null ? walkS / 60 : dkm * 1.25 / 4.8 * 60;
  const car = carS != null ? carS / 60 : dkm * 1.35 / 24 * 60 + 3;
  const transit = dkm < 1.2 ? null : (dkm < 30 ? 8 + dkm * 3.2 : car * 1.4 + 15);
  return {walk, transit, taxi: car + 4};
}
const fmtMin = m => m == null ? '—' : m < 60 ? Math.max(1, Math.round(m)) + ' min' : `${Math.floor(m / 60)} h ${pad(Math.round(m % 60))}`;
const RT = {};
async function osrm(profile, pts) {
  const k = profile + pts.map(p => p.lat.toFixed(4) + ',' + p.lon.toFixed(4)).join(';');
  if (RT[k] && Date.now() - RT[k].ts < 6e5) return RT[k].v;
  const coords = pts.map(p => `${p.lon},${p.lat}`).join(';');
  const v = pts.length === 2
    ? await getJSON(`https://routing.openstreetmap.de/routed-${profile}/route/v1/driving/${coords}?overview=full&geometries=geojson`)
    : await getJSON(`https://routing.openstreetmap.de/routed-${profile}/table/v1/driving/${coords}?sources=0`);
  RT[k] = {ts: Date.now(), v}; return v;
}
function ttHTML(t, far) {
  if (far) return `<span>${IC.loc} ${esc(far)}</span>`;
  return `<span>${IC.walk} ${fmtMin(t.walk)}</span><span>${IC.transit} ${t.transit == null ? 'walk' : '≈ ' + fmtMin(t.transit)}</span><span>${IC.car} ${fmtMin(t.taxi)}</span>`;
}
const farText = d => d > 150 ? `${Math.round(d).toLocaleString()} km from you` : '';

/* ---------- UI helpers ---------- */
const view = () => $('#view');
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.append(t); setTimeout(() => t.remove(), 2600); }
function clearMaps() { for (const m of S.maps) try { m.remove(); } catch {} S.maps = []; }
function tiles(map) {
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
}
const pin = (type, label) => L.divIcon({className: '', iconSize: [26, 26], iconAnchor: [13, 26], html: `<div class="pin ${tcls(type)}"><b>${esc(label)}</b></div>`});
const meIcon = () => L.divIcon({className: '', iconSize: [16, 16], iconAnchor: [8, 8], html: '<div class="me"></div>'});
function header(title, sub, backHash, right = '') {
  return `<header class="top"><div class="row">${backHash != null ? `<a class="ib" href="${esc(backHash || '#')}" aria-label="${backHash && backHash !== '#' ? 'Back' : 'Back to calendar'}">${backHash && backHash !== '#' ? IC.back : IC.today}</a>` : ''}
  <div style="flex:1"><h1>${esc(title)}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>${right}</div></header>`;
}
function gmaps(p, mode) {
  const dest = hasLL(p) ? `${p.lat},${p.lon}` : encodeURIComponent(p.addr || p.name || '');
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=${mode}`;
}
const amaps = p => hasLL(p) ? `https://maps.apple.com/?daddr=${p.lat},${p.lon}&dirflg=r` : `https://maps.apple.com/?daddr=${encodeURIComponent(p.addr || p.name || '')}&dirflg=r`;
const uber = p => `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${p.lat}&dropoff[longitude]=${p.lon}&dropoff[nickname]=${encodeURIComponent(p.name || '')}`;

/* ---------- lock screen ---------- */
function renderLock(msg = '') {
  clearMaps();
  view().innerHTML = `<div class="lock"><form class="box" id="unlock">
    <svg viewBox="0 0 24 24" width="56" height="56" fill="#fff" aria-hidden="true"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>
    <h1>Europe trip planner</h1><p>Enter the trip passcode to load the itinerary onto this phone. You only need to do this once.</p>
    <label for="pc" style="font-size:13px;font-weight:600">Passcode</label>
    <input id="pc" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="word-word-00" required>
    <button class="btn" type="submit">Unlock</button><div class="err" id="err">${esc(msg)}</div></form></div>`;
  $('#unlock').addEventListener('submit', async e => {
    e.preventDefault(); const pass = $('#pc').value.trim().toLowerCase(); $('#err').textContent = 'Unlocking…';
    try {
      const enc = await getJSON('data.enc.json', {cache: 'no-store'});
      const base = await decrypt(enc, pass);
      S.base = base; S.pass = pass; LS.set('base', base); LS.set('pass', pass); LS.set('encv', enc.iv);
      rebuild(); location.hash = ''; route(); setTimeout(() => sync(false), 800);
    } catch (err) { $('#err').textContent = navigator.onLine ? 'That passcode didn’t work – check it and try again.' : 'You’re offline. Connect once to load the trip.'; }
  });
}
async function decrypt(enc, pass) {
  const b = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({name: 'PBKDF2', salt: b(enc.salt), iterations: enc.iter, hash: 'SHA-256'}, km, {name: 'AES-GCM', length: 256}, false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({name: 'AES-GCM', iv: b(enc.iv)}, key, b(enc.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}

/* ---------- home: calendar ---------- */
function renderHome() {
  clearMaps();
  const [start, end] = tripRange(), t = today(), n = dayDiff(start, end) + 1;
  let status = t < start ? `Departs in ${dayDiff(t, start)} day${dayDiff(t, start) === 1 ? '' : 's'}` : t > end ? 'Trip complete' : `Day ${dayDiff(start, t) + 1} of ${n}`;
  const legs = []; let html = '', month = '', prevCity = '';
  for (let k = 0; k < n; k++) {
    const d = addDays(start, k), p = dp(d), mk = `${MOL[p.m - 1]} ${p.y}`;
    if (mk !== month) { month = mk; html += `<div class="month">${esc(mk)}</div>`; }
    const city = cityFor(d, prevCity); const base = city.split(' → ').pop();
    if (!legs.length || legs[legs.length - 1].city !== base) legs.push({city: base, from: d, to: d}); else legs[legs.length - 1].to = d;
    prevCity = base;
    const night = d === end ? null : nightOf(d);
    const nightHTML = d === end ? '' : night ? (night.kind === 'stay' ? `<span class="night">Night: ${esc(titleOf(night.i))}</span>` : `<span class="night">Overnight on ${esc(night.i.number || TYPES[night.i.type])}</span>`) : `<span class="night gap">No accommodation booked</span>`;
    const chips = entriesFor(d).map(e => { const c = chipInfo(e); const type = e.role === 'plan' ? 'sight' : e.i.type;
      return `<a class="chip ${tcls(type)}" href="#day-${d}~${encodeURIComponent(e.i.id)}"><div class="l1">${IC[type] || IC.other}<span>${esc(c.l1)}</span></div>${c.l2 ? `<div class="l2">${c.raw ? c.l2 : esc(c.l2)}</div>` : ''}</a>`; }).join('');
    html += `<div class="dayrow${d === t ? ' today' : ''}" id="d-${d}" data-day="${d}" role="link" tabindex="0" aria-label="${esc(fmtDL(d))}"><div class="dnum"><div class="w">${WD[p.wd]}</div><div class="n">${p.d}</div><div class="t">Day ${k + 1}</div></div>
      <div><div class="dhead"><span class="city">${esc(city || '—')}</span>${nightHTML}</div>${chips ? `<div class="chips">${chips}</div>` : '<div class="empty">Free day – tap to add plans</div>'}</div></div>`;
  }
  const legend = Object.keys(TYPES).filter(k => k !== 'other').map(k => `<span><i style="background:var(--${k})"></i>${TYPES[k]}</span>`).join('');
  view().innerHTML = header(S.base.trip.title, `${fmtD(start)} – ${fmtD(end)} ${dp(end).y} · ${status}<br><span class="sync" id="syncline">${syncText()}</span>`, null,
    `<a class="ib" href="#settings" aria-label="Settings and sharing">${IC.gear}</a>`) +
    `<nav class="legs" aria-label="Cities">${legs.filter(l => l.city).map(l => `<button class="leg" data-go="${l.from}"><b>${esc(l.city)}</b><span>${dp(l.from).d} ${MO[dp(l.from).m - 1]}${l.to !== l.from ? '–' + dp(l.to).d + ' ' + MO[dp(l.to).m - 1] : ''}</span></button>`).join('')}</nav>
    <div class="legend">${legend}</div>${html}
    <a class="fab" href="#add">${IC.plus}Add</a>`;
  document.documentElement.style.setProperty('--hh', $('.top').offsetHeight + 'px');
  const cal = view();
  cal.addEventListener('click', e => { if (e.target.closest('a,button')) return; const r = e.target.closest('.dayrow'); if (r) location.hash = '#day-' + r.dataset.day; });
  cal.addEventListener('keydown', e => { const r = e.target.closest && e.target.closest('.dayrow'); if (r && (e.key === 'Enter' || e.key === ' ') && e.target === r) { e.preventDefault(); location.hash = '#day-' + r.dataset.day; } });
  $$('.leg').forEach(b => b.addEventListener('click', () => scrollToDay(b.dataset.go)));
  const target = S.lastDay || (t >= start && t <= end ? t : null);
  if (target) requestAnimationFrame(() => scrollToDay(target, true)); else window.scrollTo(0, 0);
}
function scrollToDay(d, instant) {
  const el = document.getElementById('d-' + d); if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - ($('.top').offsetHeight + 40);
  window.scrollTo({top: y, behavior: instant ? 'auto' : 'smooth'});
}
const syncText = () => S.syncing ? 'Updating live info…' : `Live info updated ${ago(S.prefs.lastSync)}${navigator.onLine ? '' : ' · offline'}`;

/* ---------- day page ---------- */
function renderDay(d, hl) {
  clearMaps(); S.lastDay = d;
  const [start, end] = tripRange(); const k = dayDiff(start, d);
  let prev = ''; for (let j = 0; j < k; j++) prev = cityFor(addDays(start, j), prev).split(' → ').pop();
  const city = cityFor(d, prev), es = entriesFor(d), plan = es.find(e => e.role === 'plan');
  const night = d === end ? null : nightOf(d);
  const cards = [];
  for (const e of es) { if (e.role !== 'plan') cards.push({i: e.i, role: e.role}); }
  const stops = plan ? (plan.i.stops || []).map((s, ix) => ({i: stopItem(plan.i, ix), role: 'stop'})) : [];
  const all = cards.concat(stops);
  const nav = `<a class="ib" href="#day-${addDays(d, -1)}" aria-label="Previous day" ${d <= start ? 'style="visibility:hidden"' : ''}>${IC.back}</a><a class="ib" href="#day-${addDays(d, 1)}" aria-label="Next day" ${d >= end ? 'style="visibility:hidden"' : ''}>${IC.next}</a>`;
  view().innerHTML = header(fmtDL(d), `${esc(city)} · Day ${k + 1}<div class="wx" id="wx"></div>`, '#', nav) + `<div class="wrap">
    <div class="locbar" id="locbar">${IC.loc}<span id="locmsg">${S.pos ? 'Travel times from your location' : 'Show travel times from where you are'}</span><button class="btn sm" id="locbtn">${S.pos ? 'Refresh' : 'Use my location'}</button></div>
    ${all.some(c => hasLL(placeOf(c.i))) ? '<div class="dmap" id="dmap" role="img" aria-label="Map of the day"></div>' : ''}
    ${night ? `<div class="night" style="margin:0 2px 10px">${night.kind === 'stay' ? 'Tonight: ' + esc(titleOf(night.i)) : 'Overnight on ' + esc(night.i.number || TYPES[night.i.type])}</div>` : (d === end ? '' : '<div class="note" style="margin:0 0 10px">No accommodation booked for tonight.</div>')}
    ${cards.length ? `<h4 style="margin:4px 2px 8px;color:var(--mute);font-size:13px">Bookings & travel</h4><div class="tl">${cards.map((c, ix) => actCard(c, ix, hl)).join('')}</div>` : ''}
    ${plan ? `<h4 style="margin:16px 2px 8px;color:var(--mute);font-size:13px">Day plan</h4><div class="planbox" id="a-${esc(plan.i.id)}"><b>Plan</b>${esc(plan.i.text)} <a href="#edit-${encodeURIComponent(plan.i.id)}" class="copy">Edit</a></div>
      <div class="tl">${stops.map((c, ix) => actCard(c, cards.length + ix, hl && hl === plan.i.id ? null : hl)).join('')}</div>` : ''}
    ${!all.length && !plan ? '<p class="empty" style="font-size:15px">Nothing planned yet.</p>' : ''}
    <div style="margin-top:16px"><a class="btn" href="#add-${d}">${IC.plus}Add to this day</a></div></div>`;
  $('#locbtn').addEventListener('click', async () => { $('#locmsg').textContent = 'Finding you…'; await locate(true); if (!S.pos) { $('#locmsg').textContent = 'Location unavailable – allow location for this app in Settings.'; return; } dayTimes(all); });
  if (hl) { const el = document.getElementById('a-' + hl); if (el) requestAnimationFrame(() => el.scrollIntoView({block: 'center'})); else window.scrollTo(0, 0); } else window.scrollTo(0, 0);
  dayMap(all);
  dayEnrich(d, all, city);
  if (S.prefs.locOK) locate(false).then(() => dayTimes(all)); else dayTimes(all);
}
function keyTimes(i, role, date) {
  const kt = [];
  if (JOURNEY.has(i.type)) {
    if (role === 'arr') { kt.push(['Arrives', i.endTime]); kt.push(['Departed', `${fmtD(i.date)} ${i.time}`]); }
    else { kt.push(['Departs', i.time]); if (i.endTime) kt.push(['Arrives', i.endTime + (i.endDate > i.date ? ` (${fmtD(i.endDate)})` : '')]); const b = beThere(i); if (b) kt.push(['Be there by', b]); }
  } else if (i.type === 'stay') {
    if (i.time) kt.push(['Check in', `${i.time}${role === 'out' ? ' ' + fmtD(i.date) : ''}`]);
    if (i.endTime) kt.push(['Check out', `${i.endTime}${role !== 'out' ? ' ' + fmtD(i.endDate) : ''}`]);
  } else {
    if (i.time) kt.push(['Starts', i.time]); if (i.endTime) kt.push(['Ends', i.endTime]);
  }
  return kt;
}
function longHaul(i) { return hasLL(i.from) && hasLL(i.to) && hav(i.from, i.to) > 3000; }
function beThere(i) {
  if (!i.time) return '';
  if (i.type === 'flight') return minus(i.time, longHaul(i) ? 180 : 120);
  return minus(i.time, i.type === 'bus' ? 15 : 20);
}
function actCard(c, ix, hl) {
  const i = c.i, role = c.role, type = i.type, p = placeOf(i);
  const when = role === 'arr' || role === 'out' ? i.endTime : i.time;
  const lbl = {start: JOURNEY.has(type) ? 'Dep' : 'Start', arr: 'Arr', in: 'Check in', out: 'Check out', stop: `Stop ${+i.id.split('-').pop() + 1}`}[role] || '';
  let sum = '';
  if (JOURNEY.has(type)) sum = `${esc((i.from || {}).name)} → ${esc((i.to || {}).name)}`;
  else if (type === 'stay') { const n = dayDiff(i.date, i.endDate || i.date); sum = role === 'out' ? 'Checking out today' : `${n} night${n === 1 ? '' : 's'} · until ${esc(fmtD(i.endDate))}`; }
  else if (p && p.name && p.name !== i.title) sum = esc(p.name);
  const kt = keyTimes(i, role).map(([k, v]) => `<span><b>${esc(k)}</b>${esc(v)}</span>`).join('');
  const target = role === 'arr' ? i.to : p;
  return `<a class="act ${tcls(type)}${hl && hl === (i.planId || i.id) && !i.stop ? ' hl' : ''}" id="a-${esc(i.id)}" href="#act-${encodeURIComponent(i.id)}">
    <div class="when">${when ? esc(when) : '<span style="color:var(--mute)">·</span>'}<small>${esc(lbl)}</small></div>
    <div><h3>${IC[type] || IC.other}<span>${esc(role === 'arr' ? 'Arrive ' + shortName(i.to) : titleOf(i))}</span></h3>
    ${sum ? `<p class="sum">${sum}</p>` : ''}<p class="sum" data-wiki="${esc(i.id)}"></p>
    ${kt || target ? `<div class="kt">${kt}<span data-hrs="${esc(i.id)}"></span></div>` : ''}
    ${target && target.addr ? `<div class="addr">${esc(target.addr)}</div>` : ''}
    ${hasLL(target) ? `<div class="tt" data-tt="${ix}"></div>` : ''}
    ${i.notes && !i.stop ? `<div class="note">${esc(i.notes)}</div>` : ''}</div></a>`;
}
function dayMap(all) {
  const el = $('#dmap'); if (!el || !window.L) return;
  const map = L.map(el, {zoomControl: false, attributionControl: true, dragging: true, scrollWheelZoom: false}); tiles(map); S.maps.push(map);
  const pts = [];
  all.forEach((c, ix) => { const t = c.role === 'arr' ? c.i.to : placeOf(c.i); if (hasLL(t)) { pts.push([t.lat, t.lon]); L.marker([t.lat, t.lon], {icon: pin(c.i.type, c.role === 'stop' ? +c.i.id.split('-').pop() + 1 : '•')}).addTo(map).on('click', () => location.hash = '#act-' + encodeURIComponent(c.i.id)); } });
  // keep the map local: drop far-away points (e.g. departure airports on travel days) if the rest cluster
  const near = pts.filter(p => hav({lat: p[0], lon: p[1]}, {lat: pts[pts.length - 1][0], lon: pts[pts.length - 1][1]}) < 80);
  const use = near.length ? near : pts;
  if (use.length === 1) map.setView(use[0], 14); else map.fitBounds(use, {padding: [30, 30], maxZoom: 15});
  S.dayMap = map;
}
async function dayEnrich(d, all, city) {
  weather(city, d).then(w => { const el = $('#wx'); if (el && w) el.textContent = w; });
  for (const c of all) {
    const i = c.i, p = c.role === 'arr' ? i.to : placeOf(i);
    const w = p && p.wiki ? await wiki(p.wiki) : null;
    const wel = document.querySelector(`[data-wiki="${CSS.escape(i.id)}"]`);
    if (wel && w && w.extract && (i.type === 'sight' || i.type === 'event')) wel.textContent = w.extract.split(/(?<=\.)\s/)[0];
    if (p && hasLL(p) && !JOURNEY.has(i.type) && i.type !== 'stay') {
      const h = S.cache.hours[hkey(p)] || (navigator.onLine ? await hours(p) : null);
      const hel = document.querySelector(`[data-hrs="${CSS.escape(i.id)}"]`);
      const t = h && ohFor(h.oh, d);
      if (hel && t) hel.innerHTML = `<b>Hours</b>${esc(t)}`;
    }
  }
}
async function dayTimes(all) {
  const targets = all.map((c, ix) => ({ix, p: c.role === 'arr' ? c.i.to : placeOf(c.i)})).filter(t => hasLL(t.p));
  const pos = S.pos;
  const fill = (ix, html) => { const el = document.querySelector(`[data-tt="${ix}"]`); if (el) el.innerHTML = html; };
  if (!pos) { targets.forEach(t => fill(t.ix, '')); return; }
  $('#locmsg') && ($('#locmsg').textContent = 'Travel times from your location'); $('#locbtn') && ($('#locbtn').textContent = 'Refresh');
  if (S.dayMap && !S.dayMap._me) { S.dayMap._me = L.marker([pos.lat, pos.lon], {icon: meIcon()}).addTo(S.dayMap); }
  const near = [];
  for (const t of targets) { const d = hav(pos, t.p); if (farText(d)) fill(t.ix, ttHTML(null, farText(d))); else { fill(t.ix, ttHTML(estimate(d))); near.push({...t, d}); } }
  if (!near.length || !navigator.onLine) return;
  try {
    const pts = [pos, ...near.map(t => t.p)];
    const [f, c] = await Promise.all([osrm('foot', pts.length === 2 ? [...pts, pts[1]] : pts), osrm('car', pts.length === 2 ? [...pts, pts[1]] : pts)]);
    near.forEach((t, j) => fill(t.ix, ttHTML(estimate(t.d, f.durations[0][j + 1], c.durations[0][j + 1]))));
  } catch {}
}

/* ---------- activity detail ---------- */
function findAny(id) {
  const m = id.match(/^(p-\d{4}-\d{2}-\d{2})-(\d+)$/);
  if (m) { const plan = byId(m[1]); if (plan && plan.stops && plan.stops[+m[2]]) return stopItem(plan, +m[2]); }
  return byId(id);
}
function renderAct(id) {
  clearMaps();
  const i = findAny(id);
  if (!i) { location.hash = ''; return; }
  if (i.type === 'plan') { location.hash = '#day-' + i.date; return; }
  const p = placeOf(i), J = JOURNEY.has(i.type);
  const rows = [];
  if (J) {
    rows.push(['Departs', `${fmtD(i.date)} · ${i.time || '—'}${i.tz ? ' (' + i.tz + ')' : ''}`]);
    if (i.endTime) rows.push(['Arrives', `${fmtD(i.endDate || i.date)} · ${i.endTime}${i.endTz ? ' (' + i.endTz + ')' : ''}`]);
    const b = beThere(i); if (b) rows.push([i.type === 'flight' ? 'At the airport by' : 'At the stop by', b + (i.type === 'flight' ? (longHaul(i) ? ' – 3 h before, long-haul' : ' – 2 h before') : ' – 15 min before')]);
    if (i.terminal) rows.push(['Terminal', i.terminal]);
    if (/ryanair/i.test(i.airline || '')) rows.push(['Check-in', 'Ryanair: check in online (free) from 24 h until 2 h before departure – airport check-in costs extra.']);
    else if (i.type === 'flight') rows.push(['Check-in', 'Online check-in usually opens 24–48 h before – use the airline app.']);
  } else if (i.type === 'stay') {
    rows.push(['Check in', `${fmtD(i.date)}${i.time ? ' · from ' + i.time : ''}`]);
    rows.push(['Check out', `${fmtD(i.endDate || i.date)}${i.endTime ? ' · by ' + i.endTime : ''}`]);
    const n = dayDiff(i.date, i.endDate || i.date); rows.push(['Nights', String(n)]);
  } else {
    rows.push(['Date', fmtDL(i.date)]);
    if (i.time) rows.push(['Starts', i.time + (i.tz ? ' (' + i.tz + ')' : '')]);
    if (i.endTime) rows.push(['Ends', i.endTime]);
  }
  const extra = [];
  if (i.conf) extra.push(['Confirmation', i.conf, true]);
  if (i.airline || i.operator) extra.push(['Operator', i.airline || i.operator]);
  for (const [k, v] of Object.entries(i.details || {})) extra.push([k, v, /ticket/i.test(k)]);
  const kv = r => `<dl class="kv">${r.map(([k, v, cp]) => `<dt>${esc(k)}</dt><dd>${esc(v)}${cp ? ` <button class="copy" data-copy="${esc(v)}">Copy</button>` : ''}</dd>`).join('')}</dl>`;
  const back = '#day-' + i.date + '~' + encodeURIComponent(i.stop ? i.planId : i.id);
  const editable = !i.stop;
  view().innerHTML = header(fmtD(i.date), esc(i.city || cityOf(p) || ''), back, editable ? `<a class="ib" href="#edit-${encodeURIComponent(i.id)}">Edit</a>` : '') + `<div class="wrap">
    <div class="hero ${tcls(i.type)}"><img id="himg" alt="" class="hidden"><div class="in"><span class="pill">${esc(TYPES[i.type] || 'Activity')}</span><h2>${esc(titleOf(i))}</h2>
      ${J ? `<div class="route"><div class="big">${esc(i.time || '')}</div><div>${esc(i.from && i.from.name)}</div><div class="big">${esc(i.endTime || '')}</div><div>${esc(i.to && i.to.name)}${i.endDate > i.date ? ` <b>+${dayDiff(i.date, i.endDate)}</b>` : ''}</div></div>` : ''}
      <p class="sum" id="wikitext" style="font-size:15px;color:var(--ink)"></p><div class="src" id="wikisrc"></div></div></div>
    <div class="sec"><h4>Key times</h4>${kv(rows)}<div class="hours" id="hrs" style="margin-top:8px"></div></div>
    ${p ? `<div class="sec"><h4>${J ? 'Getting to ' + esc(shortName(p)) : 'Location'}</h4>
      <div style="font-weight:650">${esc(p.name || '')}</div>${p.addr ? `<div class="addr">${esc(p.addr)}</div>` : ''}
      ${hasLL(p) ? `<div class="modes" id="modes"></div><div class="src" id="modesrc">Turn on location to see travel times from where you are.</div>
      <div class="dmapl" id="amap" style="margin-top:10px" role="img" aria-label="Map"></div>` : '<p class="src">No map position yet – add a full address with Edit.</p>'}
      <div class="links"><a class="btn pri" href="${esc(gmaps(p, 'transit'))}" target="_blank" rel="noopener">Google Maps</a>
      <a class="btn" href="${esc(gmaps(p, 'walking'))}" target="_blank" rel="noopener">${IC.walk}Walk</a>
      <a class="btn" href="${esc(amaps(p))}" target="_blank" rel="noopener">Apple Maps</a>
      ${hasLL(p) ? `<a class="btn" href="${esc(uber(p))}" target="_blank" rel="noopener">${IC.car}Uber</a>` : ''}
      <button class="btn" id="locbtn">${IC.loc}${S.pos ? 'Refresh' : 'My location'}</button></div></div>` : ''}
    ${extra.length ? `<div class="sec"><h4>Booking details</h4>${kv(extra)}</div>` : ''}
    ${i.website || i.phone ? `<div class="sec"><h4>Contact</h4><div class="links" style="margin-top:0">${safeUrl(i.website) ? `<a class="btn" href="${esc(i.website)}" target="_blank" rel="noopener">Website</a>` : ''}${i.phone ? `<a class="btn" href="tel:${esc(i.phone.replace(/[^\d+]/g, ''))}">Call ${esc(i.phone)}</a>` : ''}</div></div>` : ''}
    ${i.notes ? `<div class="sec"><h4>Notes</h4><div>${esc(i.notes)}</div></div>` : ''}
    ${editable ? `<div class="links"><a class="btn" href="#edit-${encodeURIComponent(i.id)}">Edit</a><button class="btn danger" id="del">Delete</button></div>` : ''}
  </div>`;
  window.scrollTo(0, 0);
  $$('[data-copy]').forEach(b => b.addEventListener('click', async ev => { ev.preventDefault(); try { await navigator.clipboard.writeText(b.dataset.copy); toast('Copied'); } catch { toast(b.dataset.copy); } }));
  const del = $('#del'); if (del) del.addEventListener('click', () => { if (!confirm('Delete this from the plans on this phone?')) return; delItem(i.id); location.hash = '#day-' + i.date; });
  const lb = $('#locbtn'); if (lb) lb.addEventListener('click', async () => { lb.lastChild.textContent = 'Locating…'; await locate(true); if (!S.pos) toast('Location unavailable – allow it in Settings › Privacy › Location'); actRoute(i, p); lb.lastChild.textContent = 'Refresh'; });
  actEnrich(i, p);
  if (hasLL(p)) { actMap(i, p); (S.prefs.locOK ? locate(false) : Promise.resolve()).then(() => actRoute(i, p)); }
}
async function actEnrich(i, p) {
  const title = (p && p.wiki) || (i.type === 'flight' ? null : null);
  const w = title ? await wiki(title) : null;
  if (w && w.extract && $('#wikitext')) {
    $('#wikitext').textContent = w.extract;
    $('#wikisrc').innerHTML = `Summary from <a href="${esc(safeUrl(w.url) || 'https://en.wikipedia.org')}" target="_blank" rel="noopener">Wikipedia</a>`;
    if (safeUrl(w.img) && !JOURNEY.has(i.type)) { const im = $('#himg'); im.src = w.img; im.classList.remove('hidden'); im.onerror = () => im.classList.add('hidden'); }
  }
  if (p && hasLL(p) && !JOURNEY.has(i.type) && i.type !== 'stay') {
    const el = $('#hrs'); if (!el) return;
    el.innerHTML = '<span class="src">Checking opening hours…</span>';
    const h = await hours(p, navigator.onLine && !(S.cache.hours[hkey(p)] && Date.now() - S.cache.hours[hkey(p)].ts < 864e5));
    if (!$('#hrs')) return;
    if (h && h.oh) {
      const on = ohFor(h.oh, i.date);
      $('#hrs').innerHTML = `<dl class="kv"><dt>Hours ${esc(fmtD(i.date))}</dt><dd>${on ? `<span class="${on === 'Closed' ? 'closed' : 'open'}">${esc(on)}</span>` : 'See full hours'}</dd><dt>All hours</dt><dd>${esc(h.oh.replace(/;\s*/g, '; '))}</dd></dl>
        <div class="src">From OpenStreetMap, checked ${esc(ago(h.ts))}. Holiday hours can differ – confirm on the website.</div>`;
    } else $('#hrs').innerHTML = `<div class="src">${navigator.onLine ? 'No published opening hours found' : 'Opening hours load when you’re online'}${safeUrl(i.website) ? ' – check the website.' : '.'}</div>`;
  }
}
function actMap(i, p) {
  const el = $('#amap'); if (!el || !window.L) return;
  const map = L.map(el, {zoomControl: true, scrollWheelZoom: false}); tiles(map); S.maps.push(map); S.actMap = map;
  L.marker([p.lat, p.lon], {icon: pin(i.type, '●')}).addTo(map);
  if (JOURNEY.has(i.type) && hasLL(i.to) && hav(p, i.to) < 60) L.marker([i.to.lat, i.to.lon], {icon: pin(i.type, '◆')}).addTo(map);
  map.setView([p.lat, p.lon], 15);
}
async function actRoute(i, p) {
  const m = $('#modes'), src = $('#modesrc'); if (!m) return;
  const pos = S.pos;
  if (!pos) { m.innerHTML = ''; return; }
  const d = hav(pos, p);
  const box = t => `<div class="mode">${IC.walk}<div class="v">${fmtMin(t.walk)}</div><div class="k">Walk</div></div><div class="mode">${IC.transit}<div class="v">${t.transit == null ? 'Walk' : '≈ ' + fmtMin(t.transit)}</div><div class="k">Public transport</div></div><div class="mode">${IC.car}<div class="v">${fmtMin(t.taxi)}</div><div class="k">Taxi / rideshare</div></div>`;
  if (farText(d)) { m.innerHTML = ''; src.textContent = `You’re ${farText(d)} – travel times appear when you’re nearby.`; return; }
  m.innerHTML = box(estimate(d)); src.textContent = `${d.toFixed(1)} km away · rough estimate, updating…`;
  const map = S.actMap;
  if (map) { L.marker([pos.lat, pos.lon], {icon: meIcon()}).addTo(map); map.fitBounds([[pos.lat, pos.lon], [p.lat, p.lon]], {padding: [30, 30]}); }
  if (!navigator.onLine) { src.textContent = `${d.toFixed(1)} km away · offline estimate`; return; }
  try {
    const [f, c] = await Promise.all([osrm('foot', [pos, p]), osrm('car', [pos, p])]);
    const fr = f.routes[0], cr = c.routes[0];
    m.innerHTML = box(estimate(d, fr.duration, cr.duration));
    src.innerHTML = `Walking ${(fr.distance / 1000).toFixed(1)} km · public transport is an estimate – tap Google Maps for live times. Routes © OpenStreetMap.`;
    if (map && $('#amap')) { const g = (d < 5 ? fr : cr).geometry; const line = L.geoJSON(g, {style: {color: '#0f4c5c', weight: 5, opacity: .8}}).addTo(map); map.fitBounds(line.getBounds(), {padding: [30, 30]}); }
  } catch { src.textContent = `${d.toFixed(1)} km away · estimate (routing service unavailable)`; }
}

/* ---------- add / edit ---------- */
function delItem(id) {
  if ((S.user.added || []).some(a => a.id === id)) S.user.added = S.user.added.filter(a => a.id !== id);
  else { S.user.hidden = [...new Set([...(S.user.hidden || []), id])]; }
  delete S.user.edits[id]; S.user.ts = Date.now(); saveUser(); rebuild(); toast('Deleted');
}
function renderForm(id, date) {
  clearMaps();
  const it = id ? byId(id) : null;
  if (id && !it) { location.hash = ''; return; }
  if (it && it.type === 'plan') return renderPlanForm(it);
  const v = it || {type: 'sight', date: date || S.lastDay || tripRange()[0]};
  const pl = v.place || {}, fr = v.from || {}, to = v.to || {};
  const radio = Object.keys(TYPES).map(k => `<label class="${tcls(k)}"><input type="radio" name="type" value="${k}" ${v.type === k ? 'checked' : ''}><span><i></i>${TYPES[k]}</span></label>`).join('');
  const f = (n, l, val = '', t = 'text', extra = '') => `<div class="f"><label for="f-${n}">${l}</label><input id="f-${n}" name="${n}" type="${t}" value="${esc(val)}" ${extra}></div>`;
  view().innerHTML = header(it ? 'Edit' : 'Add to the plans', it ? esc(titleOf(it)) : 'Travel, a stay, sightseeing or anything else', it ? '#act-' + encodeURIComponent(id) : (date ? '#day-' + date : '#')) + `<form class="wrap" id="frm" novalidate>
    <div class="f"><label>Type</label><div class="types">${radio}</div></div>
    <div id="g-j">${f('number', 'Flight / train / bus number', v.number)}
      <div class="two">${f('fromName', 'From', fr.code || fr.name)}${f('toName', 'To', to.code || to.name)}</div>
      ${f('fromAddr', 'Departure address or station', fr.addr || (fr.code ? '' : ''), 'text', 'placeholder="e.g. Gare de Lyon, Paris"')}${f('toAddr', 'Arrival address or station', to.addr || '', 'text', 'placeholder="e.g. Milano Centrale"')}</div>
    <div id="g-p">${f('title', 'Name', it && !JOURNEY.has(it.type) ? (it.title || pl.name) : '', 'text', 'placeholder="e.g. Hotel name, museum, restaurant"')}
      ${f('addr', 'Address', pl.addr || '', 'text', 'placeholder="Street, city"')}</div>
    <div class="two">${f('date', '<span id="l-date">Date</span>', v.date, 'date', 'required')}${f('time', '<span id="l-time">Time</span>', v.time || '', 'time')}</div>
    <div class="two">${f('endDate', '<span id="l-edate">End date</span>', v.endDate && v.endDate !== v.date ? v.endDate : (v.endDate || ''), 'date')}${f('endTime', '<span id="l-etime">End time</span>', v.endTime || '', 'time')}</div>
    ${f('tz', 'Time zone (optional)', v.tz || '', 'text', 'placeholder="e.g. GMT+1"')}
    <div class="two">${f('conf', 'Confirmation', v.conf || '')}${f('phone', 'Phone', v.phone || '', 'tel')}</div>
    ${f('website', 'Website', v.website || '', 'url', 'placeholder="https://"')}
    <div class="f"><label for="f-notes">Notes</label><textarea id="f-notes" name="notes">${esc(v.notes || '')}</textarea></div>
    <div class="err" id="ferr" style="color:#c0262d"></div>
    <div class="links"><button class="btn pri" type="submit" style="flex:1">Save</button>${it ? '' : ''}</div></form>`;
  const sync = () => { const t = $('input[name=type]:checked').value, J = JOURNEY.has(t);
    $('#g-j').classList.toggle('hidden', !J); $('#g-p').classList.toggle('hidden', J);
    $('#l-date').textContent = t === 'stay' ? 'Check-in date' : J ? 'Departure date' : 'Date';
    $('#l-time').textContent = t === 'stay' ? 'Check-in time' : J ? 'Departs' : 'Starts';
    $('#l-edate').textContent = t === 'stay' ? 'Check-out date' : J ? 'Arrival date' : 'End date (optional)';
    $('#l-etime').textContent = t === 'stay' ? 'Check-out time' : J ? 'Arrives' : 'Ends'; };
  $$('input[name=type]').forEach(r => r.addEventListener('change', sync)); sync();
  $('#frm').addEventListener('submit', async e => {
    e.preventDefault(); const fd = Object.fromEntries(new FormData(e.target).entries()); const t = fd.type, J = JOURNEY.has(t);
    if (!fd.date) { $('#ferr').textContent = 'Please choose a date.'; return; }
    if (J && !(fd.fromName && fd.toName)) { $('#ferr').textContent = 'Please fill in From and To.'; return; }
    if (!J && !fd.title) { $('#ferr').textContent = 'Please give it a name.'; return; }
    if (t === 'stay' && (!fd.endDate || fd.endDate <= fd.date)) { $('#ferr').textContent = 'Check-out date must be after check-in.'; return; }
    $('#ferr').textContent = navigator.onLine ? 'Saving and finding the location…' : 'Saving…';
    const n = {id: it ? it.id : 'u' + Date.now().toString(36), type: t, date: fd.date, time: fd.time, endDate: fd.endDate || fd.date, endTime: fd.endTime, tz: fd.tz,
      conf: fd.conf, phone: fd.phone, website: fd.website, notes: fd.notes, details: it ? it.details : undefined, terminal: it ? it.terminal : undefined, airline: it ? it.airline : undefined, operator: it ? it.operator : undefined, user: true};
    const loc = async (name, addr, old) => {
      const o = {...(old || {})};
      const isCode = /^[A-Z]{3}$/.test(name.trim());
      o.code = isCode ? name.trim() : (o.code && o.code === name ? o.code : undefined);
      o.name = isCode && o.name && o.code === name.trim() ? o.name : name; o.addr = addr;
      const changed = !old || (old.addr || '') !== addr || (old.code || old.name || '') !== name;
      if (changed || !hasLL(old)) { const g = await geocode(addr || (isCode ? name + ' airport' : name)); if (g) { o.lat = g.lat; o.lon = g.lon; } else if (changed) { delete o.lat; delete o.lon; } }
      return o;
    };
    if (J) { n.number = fd.number; n.from = await loc(fd.fromName, fd.fromAddr, it && it.from); n.to = await loc(fd.toName, fd.toAddr, it && it.to); }
    else { n.title = fd.title; n.place = await loc(fd.title, fd.addr, it && it.place); if (it && it.place) { n.place.wiki = it.place.wiki; n.place.osm = it.place.osm; } if (it && it.city) n.city = it.city; }
    Object.keys(n).forEach(k => n[k] === undefined && delete n[k]);
    if (!it || it.user && (S.user.added || []).some(a => a.id === it.id)) { S.user.added = (S.user.added || []).filter(a => a.id !== n.id).concat(n); }
    else { S.user.edits[n.id] = n; }
    S.user.ts = Date.now(); saveUser(); rebuild(); toast('Saved'); location.hash = '#act-' + encodeURIComponent(n.id);
  });
}
function renderPlanForm(it) {
  view().innerHTML = header('Edit day plan', esc(fmtDL(it.date)), '#day-' + it.date) + `<form class="wrap" id="pf">
    <div class="f"><label for="pc1">City</label><input id="pc1" name="city" value="${esc(it.city || '')}"></div>
    <div class="f"><label for="pt1">Plan</label><textarea id="pt1" name="text" style="min-height:160px">${esc(it.text || '')}</textarea></div>
    <p class="src">The stops on the map come from the original itinerary. To add a new place with a map and directions, use Add › Sightseeing.</p>
    <div class="links"><button class="btn pri" type="submit" style="flex:1">Save</button></div></form>`;
  $('#pf').addEventListener('submit', e => { e.preventDefault(); const fd = Object.fromEntries(new FormData(e.target).entries());
    S.user.edits[it.id] = {...(S.user.edits[it.id] || {}), city: fd.city, text: fd.text}; S.user.ts = Date.now(); saveUser(); rebuild(); toast('Saved'); location.hash = '#day-' + it.date; });
}

/* ---------- settings / sharing ---------- */
const b64e = s => btoa(unescape(encodeURIComponent(s))), b64d = s => decodeURIComponent(escape(atob(s)));
function renderSettings() {
  clearMaps();
  const code = 'TRIPPLAN1:' + b64e(JSON.stringify({added: S.user.added || [], edits: S.user.edits || {}, hidden: S.user.hidden || [], ts: S.user.ts || 0}));
  const nAdd = (S.user.added || []).length + Object.keys(S.user.edits || {}).length + (S.user.hidden || []).length;
  view().innerHTML = header('Settings & sharing', 'Version ' + VERSION, '#') + `<div class="wrap">
    <div class="sec"><h4>Live information</h4><p style="margin:0 0 8px">Opening hours, place summaries and weather are saved on this phone so they work offline. Directions refresh whenever you open an activity.</p>
      <p class="src" id="sl">${esc(syncText())}</p>
      <label style="display:flex;gap:10px;align-items:center;margin:8px 0"><input type="checkbox" id="auto" style="width:22px;min-height:22px" ${S.prefs.auto ? 'checked' : ''}> Refresh automatically every 6 hours when online</label>
      <button class="btn pri" id="syncnow">Refresh now</button><p class="src">Tip: tap Refresh now on hotel wifi to save mobile data.</p></div>
    <div class="sec"><h4>Share your changes</h4><p style="margin:0 0 8px">Additions and edits are saved on this phone (${nAdd} change${nAdd === 1 ? '' : 's'}). To put them on another phone, share this code and paste it there under Import.</p>
      <div class="links" style="margin-top:0"><button class="btn pri" id="share">Share code</button><button class="btn" id="copycode">Copy code</button></div></div>
    <div class="sec"><h4>Import changes</h4><textarea id="imp" placeholder="Paste a TRIPPLAN1: code"></textarea><button class="btn" id="doimp" style="margin-top:8px">Import and merge</button></div>
    <div class="sec"><h4>Install on iPhone</h4><p style="margin:0">In Safari tap Share › Add to Home Screen. The Home Screen app keeps its own copy, so enter the passcode once more after adding it.</p></div>
    <div class="sec"><h4>This phone</h4><button class="btn danger" id="lock">Lock and remove trip from this phone</button></div>
    <p class="src">Maps © OpenStreetMap contributors. Routes: OSRM / FOSSGIS. Hours: OpenStreetMap. Summaries: Wikipedia. Weather: Open-Meteo.</p></div>`;
  $('#auto').addEventListener('change', e => { S.prefs.auto = e.target.checked; savePrefs(); });
  $('#syncnow').addEventListener('click', () => sync(true));
  $('#share').addEventListener('click', async () => { try { if (navigator.share) await navigator.share({title: 'Trip plan changes', text: code}); else { await navigator.clipboard.writeText(code); toast('Code copied'); } } catch {} });
  $('#copycode').addEventListener('click', async () => { try { await navigator.clipboard.writeText(code); toast('Code copied'); } catch { $('#imp').value = code; toast('Select and copy the code below'); } });
  $('#doimp').addEventListener('click', () => {
    try {
      const raw = $('#imp').value.trim().replace(/^.*?TRIPPLAN1:/s, '').split(/\s/)[0];
      const o = JSON.parse(b64d(raw)); const ids = new Set((S.user.added || []).map(a => a.id));
      S.user.added = (S.user.added || []).map(a => (o.added || []).find(b => b.id === a.id) || a).concat((o.added || []).filter(b => !ids.has(b.id)));
      S.user.edits = {...(S.user.edits || {}), ...(o.edits || {})}; S.user.hidden = [...new Set([...(S.user.hidden || []), ...(o.hidden || [])])];
      S.user.ts = Date.now(); saveUser(); rebuild(); toast('Imported'); renderSettings();
    } catch { toast('That code didn’t work – copy the whole thing.'); }
  });
  $('#lock').addEventListener('click', () => { if (!confirm('Remove the trip and your changes from this phone? Share your changes first if you want to keep them.')) return;
    ['base', 'pass', 'user', 'cache', 'encv'].forEach(LS.del); S.base = null; S.user = {added: [], edits: {}, hidden: []}; location.hash = ''; renderLock(); });
}

/* ---------- sync ---------- */
async function sync(manual) {
  if (S.syncing) return; if (!navigator.onLine) { if (manual) toast('You’re offline'); return; }
  S.syncing = true; const sl = $('#syncline') || $('#sl'); if (sl) sl.textContent = syncText();
  try {
    try {
      const enc = await getJSON('data.enc.json', {cache: 'no-store'});
      if (enc.iv !== LS.get('encv', '')) { const b = await decrypt(enc, S.pass); S.base = b; LS.set('base', b); LS.set('encv', enc.iv); rebuild(); toast('Itinerary updated'); }
    } catch {}
    for (const a of S.user.added || []) for (const p of allPlaces(a)) if (!hasLL(p) && (p.addr || p.name)) { const g = await geocode(p.addr || p.name); if (g) { p.lat = g.lat; p.lon = g.lon; saveUser(); } await new Promise(r => setTimeout(r, 1100)); }
    const t = today(), list = ITEMS.slice().sort((a, b) => a.date < b.date ? -1 : 1).filter(i => (i.endDate || i.date) >= addDays(t, -1));
    const places = []; for (const i of list) for (const p of allPlaces(i)) places.push({p, i});
    const wq = [...new Set(places.map(x => x.p.wiki).filter(Boolean))].filter(w => !S.cache.wiki[w] || Date.now() - S.cache.wiki[w].ts > 14 * 864e5);
    for (let k = 0; k < wq.length; k += 4) await Promise.all(wq.slice(k, k + 4).map(wiki));
    let n = 0;
    for (const {p, i} of places) {
      if (n >= 30) break; if (JOURNEY.has(i.type) || !hasLL(p)) continue;
      const c = S.cache.hours[hkey(p)]; if (c && Date.now() - c.ts < 7 * 864e5) continue;
      await hours(p, true); n++; await new Promise(r => setTimeout(r, 1500));
    }
    const cities = new Set(); for (let k = 0; k < 16; k++) { const d = addDays(t, k); const c = cityFor(d, ''); if (c) cities.add(c.split(' → ').pop()); }
    for (const c of cities) await weather(c, t);
    S.prefs.lastSync = Date.now(); savePrefs(); if (manual) toast('Live info updated');
  } finally { S.syncing = false; const s2 = $('#syncline') || $('#sl'); if (s2) s2.textContent = syncText(); }
}

/* ---------- router ---------- */
function route() {
  if (!S.base) return renderLock();
  const h = decodeURIComponent(location.hash.slice(1)); let m;
  if ((m = h.match(/^day-(\d{4}-\d{2}-\d{2})(?:~(.+))?$/))) return renderDay(m[1], m[2]);
  if ((m = h.match(/^act-(.+)$/))) return renderAct(m[1]);
  if ((m = h.match(/^add(?:-(\d{4}-\d{2}-\d{2}))?$/))) return renderForm(null, m[1]);
  if ((m = h.match(/^edit-(.+)$/))) return renderForm(m[1]);
  if (h === 'settings') return renderSettings();
  renderHome();
}
window.addEventListener('hashchange', route);
window.addEventListener('online', () => { if (S.base && S.prefs.auto && Date.now() - S.prefs.lastSync > 6 * 3600e3) sync(false); const s = $('#syncline'); if (s) s.textContent = syncText(); });
window.addEventListener('offline', () => { const s = $('#syncline'); if (s) s.textContent = syncText(); });
if (S.base) rebuild();
route();
if (S.base && S.prefs.auto && Date.now() - S.prefs.lastSync > 6 * 3600e3) setTimeout(() => sync(false), 1500);
if ('serviceWorker' in navigator && location.protocol === 'https:' || location.hostname === 'localhost') navigator.serviceWorker && navigator.serviceWorker.register('sw.js').catch(() => {});
}

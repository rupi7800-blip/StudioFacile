/* =========================================================
   StudioFacile — passa gli esami in tranquillità
   30 minuti al giorno: riassunti → crocette → domande aperte → simulazioni
   Tutto resta sul telefono (IndexedDB). Nessun account.
   ========================================================= */
(function () {
'use strict';

/* ---------------- utilità ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => (n < 10 ? '0' : '') + n;
const ds = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const pd = s => { const [y, m, g] = String(s).split('-').map(Number); return new Date(y, m - 1, g); };
const oggi = () => ds(new Date());
const addD = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ds(d); };
const diffD = (a, b) => Math.round((pd(b) - pd(a)) / 86400000);
const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const fData = (s, lungo) => { if (!s) return ''; const d = pd(s); return (lungo ? GIORNI[d.getDay()] + ' ' : '') + d.getDate() + ' ' + MESI[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''); };
const quandoTra = s => { const n = diffD(oggi(), s); return n === 0 ? 'oggi' : n === 1 ? 'domani' : n === -1 ? 'ieri' : n > 0 ? 'tra ' + n + ' giorni' : n + ' giorni fa'; };
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function mescola(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const ICONS = {
  home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 7h6"/>',
  cal: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  read: '<path d="M2 5c3-1.5 7-1.5 10 1 3-2.5 7-2.5 10-1v14c-3-1.5-7-1.5-10 1-3-2.5-7-2.5-10-1z"/><path d="M12 6v14"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  quiz: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m8 12 3 3 5-6"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  pause: '<path d="M7 4h3v16H7zM14 4h3v16h-3z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  next: '<path d="m9 18 6-6-6-6"/>',
  upload: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 15v5h14v-5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',
  euro: '<path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10h9M4 14h9"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10 5-3v10l-5-3"/>',
  dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  fire: '<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-5 8-1-1-2-2-2-4-2 2-2 4-2 8 0 4 3 7 7 7z"/>',
  bell: '<path d="M6 9a6 6 0 1 1 12 0c0 6 3 7 3 7H3s3-1 3-7"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  file: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
};
const I = (n, cls) => `<svg class="i ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------------- archivio (IndexedDB, con riserva localStorage) ---------------- */
const DBN = 'studiofacile', KEY = 'stato';
function idb() {
  return new Promise((ok, ko) => {
    if (!window.indexedDB) return ko(new Error('no idb'));
    const r = indexedDB.open(DBN, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
}
async function leggiStato() {
  try {
    const db = await idb();
    return await new Promise((ok, ko) => { const t = db.transaction('kv').objectStore('kv').get(KEY); t.onsuccess = () => ok(t.result || null); t.onerror = () => ko(t.error); });
  } catch (e) { try { return JSON.parse(localStorage.getItem('studiofacile.stato')); } catch (er) { return null; } }
}
let tSave = null;
function save() {
  clearTimeout(tSave);
  tSave = setTimeout(salvaOra, 250);
  if (window.Ponte) Ponte.cambiato();
}
async function salvaOra() {
  const copia = JSON.parse(JSON.stringify(S));
  try {
    const db = await idb();
    await new Promise((ok, ko) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(copia, KEY); t.oncomplete = ok; t.onerror = () => ko(t.error); });
  } catch (e) {
    try { localStorage.setItem('studiofacile.stato', JSON.stringify(copia)); } catch (er) { toast('Memoria piena: esporta un backup'); }
  }
}

/* immagini (appunti, foto, pagine dei PDF): salvate a parte per non appesantire lo stato */
async function imgPut(id, dataUrl) {
  try { const db = await idb(); await new Promise((ok, ko) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(dataUrl, 'img:' + id); t.oncomplete = ok; t.onerror = () => ko(t.error); }); return true; }
  catch (e) { toast('Non riesco a salvare l\'immagine'); return false; }
}
async function imgGet(id) {
  try { const db = await idb(); return await new Promise(ok => { const t = db.transaction('kv').objectStore('kv').get('img:' + id); t.onsuccess = () => ok(t.result || null); t.onerror = () => ok(null); }); }
  catch (e) { return null; }
}
async function imgDel(id) { try { const db = await idb(); db.transaction('kv', 'readwrite').objectStore('kv').delete('img:' + id); } catch (e) { /* no */ } }
function riduciImmagine(src, max) {
  return new Promise((ok, ko) => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, (max || 1600) / Math.max(im.width, im.height));
      const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
      ok(c.toDataURL('image/jpeg', 0.8));
    };
    im.onerror = () => ko(new Error('immagine non leggibile'));
    im.src = src;
  });
}
const leggiFileUrl = f => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => ko(r.error); r.readAsDataURL(f); });
const caricati = {};
function caricaScript(src) {
  return caricati[src] || (caricati[src] = new Promise((ok, ko) => { const x = document.createElement('script'); x.src = src; x.onload = ok; x.onerror = () => { delete caricati[src]; ko(new Error('serve la connessione la prima volta')); }; document.head.appendChild(x); }));
}
async function testoDaPdf(file, avanzamento) {
  await caricaScript('js/lib/pdf.min.js');
  const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = 'js/lib/pdf.worker.min.js';
  const doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const pagine = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i), tc = await pg.getTextContent();
    let t = '', y = null;
    tc.items.forEach(it => { const yy = it.transform ? it.transform[5] : 0; if (y !== null && Math.abs(yy - y) > 4) t += '\n'; else if (t && !t.endsWith(' ')) t += ' '; t += it.str; y = yy; });
    pagine.push(t.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim());
    if (avanzamento) avanzamento(i, doc.numPages);
  }
  return { doc, pagine };
}
async function paginePdfComeImmagini(doc, max, avanzamento) {
  const out = [];
  for (let i = 1; i <= Math.min(doc.numPages, max || 60); i++) {
    const pg = await doc.getPage(i), v0 = pg.getViewport({ scale: 1 }), k = 1300 / Math.max(v0.width, v0.height), v = pg.getViewport({ scale: k });
    const c = document.createElement('canvas'); c.width = v.width; c.height = v.height;
    await pg.render({ canvasContext: c.getContext('2d'), viewport: v }).promise;
    out.push({ nome: 'Pagina ' + i, dataUrl: c.toDataURL('image/jpeg', 0.75) });
    if (avanzamento) avanzamento(i, Math.min(doc.numPages, max || 60));
  }
  return out;
}
async function testoDaDocx(file) {
  await caricaScript('js/lib/mammoth.browser.min.js');
  const r = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return r.value.replace(/\n{3,}/g, '\n\n').trim();
}

function statoVuoto() {
  return {
    v: 1,
    imp: { nome: '', minuti: 30, oraStudio: '20:30', sedute: 1, orari: ['20:30', '07:30', '13:00'], giorni: [0, 1, 2, 3, 4, 5, 6], studioInAgenda: false, totCfu: 180, avvisoGiorni: 3, voceVel: 1, voceNome: '', notifiche: false,
      email: { url: '', codice: '', mittenti: [], giorni: 60, ultimo: 0 } },
    materie: [], focus: '', lezioni: [], crocette: [], aperte: [], srs: {}, sim: [], log: {},
    oggi: { data: '', fatti: {}, lette: [], forza: false }, scad: [], posta: [], notificati: {},
    tesi: null
  };
}
let S = statoVuoto();

/* ---------------- materie, lezioni, ripetizione spaziata ---------------- */
const COLORI = ['#2f6f5e', '#3b6fd8', '#c0582f', '#8a4fd1', '#c4912a', '#cf4b6c', '#1f8aa0', '#6a7c2a'];
const mat = id => S.materie.find(m => m.id === id);
const lezDi = mid => S.lezioni.filter(l => l.mid === mid).sort((a, b) => (a.n || 999) - (b.n || 999) || a.titolo.localeCompare(b.titolo));
const croDi = mid => S.crocette.filter(c => c.mid === mid);
const apeDi = mid => S.aperte.filter(a => a.mid === mid);
const INTERVALLI = [0, 1, 2, 4, 8, 16, 32]; // giorni per "scatola"
const srs = id => S.srs[id] || (S.srs[id] = { b: 0, due: '', v: 0, ok: 0 });
const vista = id => !!(S.srs[id] && S.srs[id].v);
function voto(id, giusto) {
  const r = srs(id); r.v++; r.ultima = oggi();
  if (giusto) { r.ok++; r.b = Math.min(r.b + 1, INTERVALLI.length - 1); }
  else r.b = 1;
  r.due = addD(oggi(), INTERVALLI[r.b]);
}
const padroneggiata = id => (S.srs[id] && S.srs[id].b >= 4);

function nuovaMateria(nome, extra) {
  const m = Object.assign({ id: uid(), nome: nome.trim(), cfu: '', colore: COLORI[S.materie.length % COLORI.length], stato: 'studio', voto: '', inizio: oggi(), simN: 30, simMin: 30, creata: Date.now() }, extra || {});
  S.materie.push(m);
  if (!S.focus || !mat(S.focus) || mat(S.focus).stato !== 'studio') S.focus = m.id;
  return m;
}
function esameDi(mid) {
  return S.scad.filter(s => s.mid === mid && s.tipo === 'esame' && s.data >= oggi()).sort((a, b) => a.data.localeCompare(b.data))[0] || null;
}
function materiaAttiva() {
  let m = mat(S.focus);
  if (m && m.stato === 'studio') return m;
  m = S.materie.filter(x => x.stato === 'studio').sort((a, b) => ((esameDi(a.id) || {}).data || '9').localeCompare((esameDi(b.id) || {}).data || '9'))[0];
  if (m) S.focus = m.id;
  return m || null;
}

/* ---------------- il piano ---------------- */
const FASI = ['Riassunti', 'Crocette', 'Domande aperte', 'Simulazioni'];
function piano(m) {
  const es = esameDi(m.id);
  const inizio = m.inizio || oggi();
  const fine = es ? es.data : addD(inizio, 28);
  const tot = Math.max(7, diffD(inizio, fine));
  const passati = Math.max(0, diffD(inizio, oggi()));
  const mancano = Math.max(0, diffD(oggi(), fine));
  let fase = Math.min(3, Math.floor((passati / tot) * 4));
  if (mancano <= 3 && es) fase = 3;
  const lez = lezDi(m.id), nonLette = lez.filter(l => !l.letta);
  // se mancano ancora molte lezioni da leggere, la fase non può essere oltre "Crocette"
  if (nonLette.length && nonLette.length > lez.length / 2 && fase > 1) fase = 1;
  return { es, fine, tot, passati, mancano, fase, lez, nonLette, settimana: Math.floor(passati / 7) + 1, senzaData: !es };
}
const giornoStudio = (d) => (S.imp.giorni || [0, 1, 2, 3, 4, 5, 6]).includes(pd(d || oggi()).getDay());
const ORARI_DEF = { 1: ['20:30'], 2: ['07:30', '20:30'], 3: ['07:30', '13:00', '20:30'] };
const orarioSeduta = i => {
  const N = Math.max(1, Math.min(3, +S.imp.sedute || 1));
  if (S.imp.orariMod && (S.imp.orari || [])[i]) return S.imp.orari[i];
  return (N === 1 ? S.imp.oraStudio : null) || ORARI_DEF[N][i] || '20:30';
};
/** Le sedute di oggi: ognuna dura S.imp.minuti; ritorna { p, passi (tutti), sedute: [{ i, ora, passi }] } */
function passiDiOggi(m) {
  const p = piano(m), k = (S.imp.minuti || 30) / 30, N = Math.max(1, Math.min(3, +S.imp.sedute || 1));
  const cro = croDi(m.id), ape = apeDi(m.id);
  if (!p.lez.length && !cro.length) {
    const imp = { id: 'import', tipo: 'import', titolo: 'Importa il primo pacchetto', desc: 'Carica le slide in Claude, oppure i tuoi appunti o un file' };
    return { p, passi: [imp], sedute: [{ i: 0, ora: orarioSeduta(0), passi: [imp] }] };
  }
  // lezioni da leggere oggi, nell'ordine: prima quelle già lette oggi (restano nella loro seduta), poi le non lette
  const ids = new Set(p.lez.map(l => l.id));
  const letteOggi = (S.oggi.data === oggi() ? S.oggi.lette || [] : []).filter(id => ids.has(id)).map(id => p.lez.find(l => l.id === id));
  const cand = letteOggi.concat(p.nonLette.filter(l => !letteOggi.includes(l)));
  let iLet = 0, simFatta = false;
  const pari = diffD('2026-01-01', oggi()) % 2 === 0;
  const sedute = [];
  for (let s = 0; s < N; s++) {
    const suf = s ? '-' + (s + 1) : '', passi = [];
    const lettura = () => {
      const l = cand[iLet]; if (!l) return false; iLet++;
      passi.push({ id: 'let-' + l.id, tipo: 'lettura', lid: l.id, titolo: 'Leggi o ascolta: ' + l.titolo, desc: 'Riassunto · circa ' + Math.round(15 * k) + ' minuti' });
      return true;
    };
    const crocette = n => { n = Math.round(n * k); n = Math.min(n, scegliCrocette(m.id, n).length); if (cro.length && n > 0) passi.push({ id: 'cro' + suf, tipo: 'crocette', n, titolo: n + ' crocette', desc: 'Ripasso intelligente · circa ' + n + ' minuti' }); };
    const aperte = n => { n = Math.max(1, Math.round(n * k)); if (ape.length) passi.push({ id: 'ape' + suf, tipo: 'aperte', n, titolo: n + ' domand' + (n === 1 ? 'a aperta' : 'e aperte') + ' a voce', desc: 'Rispondi ad alta voce, poi confronta · circa ' + n * 4 + ' minuti' }); };
    const simula = () => { if (cro.length >= 10 && !simFatta) { simFatta = true; passi.push({ id: 'sim', tipo: 'sim', titolo: 'Simulazione d\'esame', desc: Math.min(m.simN, cro.length) + ' crocette in ' + m.simMin + ' minuti, voto stimato' }); return true; } return false; };
    if (p.fase === 0) { const ok = lettura(); crocette(ok ? 12 : 22); if (!ok) aperte(2); }
    else if (p.fase === 1) { const ok = lettura(); crocette(ok ? 14 : 22); if (!ok) aperte(2); }
    else if (p.fase === 2) { if (!lettura()) aperte(4); crocette(14); }
    else { if ((pari || p.mancano <= 3) && simula()) aperte(1); else { aperte(3); crocette(16); } }
    if (!passi.length) crocette(25);
    if (!passi.length) {
      // niente di nuovo per questa seduta: ripasso di una lezione già letta (quella vista meno di recente)
      const gia = p.lez.filter(l => l.letta || letteOggi.includes(l)).sort((a, b) => (a.ripasso || 0) - (b.ripasso || 0))[s % Math.max(1, p.lez.length)] || p.lez[0];
      if (gia) passi.push({ id: 'rip-' + gia.id + suf, tipo: 'lettura', lid: gia.id, titolo: 'Ripassa: ' + gia.titolo, desc: 'Rileggi o riascolta · circa ' + Math.round(15 * k) + ' minuti' });
    }
    sedute.push({ i: s, ora: orarioSeduta(s), passi });
  }
  return { p, passi: [].concat(...sedute.map(x => x.passi)), sedute };
}
function fattoOggi(stepId) { return S.oggi.data === oggi() && !!S.oggi.fatti[stepId]; }
function segnaFatto(stepId) {
  if (S.oggi.data !== oggi()) S.oggi = { data: oggi(), fatti: {}, lette: [], forza: false };
  S.oggi.fatti[stepId] = true;
}
function registra(mid, campi) {
  const d = oggi(), l = S.log[d] || (S.log[d] = { min: 0, croc: 0, ok: 0, aperte: 0, lette: 0, sim: 0 });
  Object.keys(campi).forEach(k => { l[k] = (l[k] || 0) + campi[k]; });
  l.mid = mid;
}
function serie() {
  // conta i giorni di studio di fila; i giorni liberi scelti da te non interrompono la serie
  let n = 0, d = oggi(), giri = 0;
  if (!attivo(d)) d = addD(d, -1);
  while (giri++ < 400) {
    if (attivo(d)) n++;
    else if (giornoStudio(d)) break;
    d = addD(d, -1);
  }
  return n;
  function attivo(x) { const l = S.log[x]; return !!(l && (l.min >= 5 || l.croc || l.lette || l.aperte || l.sim)); }
}
function pronto(mid) {
  const sims = S.sim.filter(s => s.mid === mid).slice(-3);
  const cro = croDi(mid), pad = cro.filter(c => padroneggiata(c.id)).length;
  const perc = cro.length ? Math.round(pad / cro.length * 100) : 0;
  if (!sims.length) return { c: 'rosso', t: 'Ancora nessuna simulazione', d: perc + '% delle crocette già consolidate. Le simulazioni arrivano nell\'ultima settimana.', perc };
  const ult = sims.slice(-2).map(s => s.ok / s.tot);
  if (ult.length >= 2 && ult.every(x => x >= 0.7)) return { c: 'verde', t: 'Sei pronto: prenota l\'appello', d: 'Le ultime due simulazioni sono sopra 21/30.', perc };
  if (ult[ult.length - 1] >= 0.6) return { c: 'giallo', t: 'Quasi pronto', d: 'Ultima simulazione ' + sims[sims.length - 1].voto + '/30. Ancora qualche seduta di crocette.', perc };
  return { c: 'rosso', t: 'Non ancora', d: 'Ultima simulazione ' + sims[sims.length - 1].voto + '/30: insisti sulle crocette sbagliate.', perc };
}

/* ---------------- importazione pacchetti ---------------- */
function estraiJson(testo) {
  testo = String(testo || '').trim();
  const blocco = testo.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (blocco) testo = blocco[1].trim();
  const a = testo.indexOf('{'), b = testo.lastIndexOf('}');
  const a2 = testo.indexOf('[');
  if (a2 >= 0 && (a2 < a || a < 0)) { const b2 = testo.lastIndexOf(']'); return JSON.parse(testo.slice(a2, b2 + 1)); }
  if (a < 0 || b < 0) throw new Error('Non trovo un pacchetto nel testo');
  return JSON.parse(testo.slice(a, b + 1));
}
function indiceGiusta(g, opzioni) {
  if (typeof g === 'number') return g >= 0 && g < opzioni.length ? g : (g >= 1 && g <= opzioni.length ? g - 1 : -1);
  const s = String(g == null ? '' : g).trim();
  if (/^[A-Fa-f]$/.test(s)) return s.toUpperCase().charCodeAt(0) - 65;
  if (/^\d+$/.test(s)) return indiceGiusta(+s, opzioni);
  const n = norm(s);
  return opzioni.findIndex(o => norm(o) === n);
}
function importaPacchetti(dati) {
  const lista = Array.isArray(dati) ? dati : [dati];
  const res = { materie: new Set(), lezioni: 0, crocette: 0, aperte: 0, scartate: 0 };
  for (const p of lista) {
    if (!p || typeof p !== 'object') continue;
    const nomeM = String(p.materia || p.esame || '').trim();
    if (!nomeM) throw new Error('Nel pacchetto manca il nome della materia');
    let m = S.materie.find(x => norm(x.nome) === norm(nomeM));
    if (!m) m = nuovaMateria(nomeM, { cfu: p.cfu || '' });
    else if (p.cfu && !m.cfu) m.cfu = p.cfu;
    res.materie.add(m.nome);
    for (const L of p.lezioni || [p]) {
      if (!L || (!L.titolo && !L.riassunto && !L.crocette)) continue;
      const titolo = String(L.titolo || ('Lezione ' + (L.numero || ''))).trim();
      // la stessa lezione importata di nuovo sostituisce la vecchia (il ripasso fatto resta per le domande uguali)
      let lez = S.lezioni.find(x => x.mid === m.id && (norm(x.titolo) === norm(titolo) || (L.numero && x.n === +L.numero)));
      const vecchieC = new Map(), vecchieA = new Map();
      if (lez) {
        S.crocette.filter(c => c.lid === lez.id).forEach(c => vecchieC.set(norm(c.d), c.id));
        S.aperte.filter(a => a.lid === lez.id).forEach(a => vecchieA.set(norm(a.d), a.id));
        S.crocette = S.crocette.filter(c => c.lid !== lez.id);
        S.aperte = S.aperte.filter(a => a.lid !== lez.id);
        Object.assign(lez, { titolo, n: +L.numero || lez.n, riassunto: String(L.riassunto || lez.riassunto || '') });
      } else {
        lez = { id: uid(), mid: m.id, n: +L.numero || (lezDi(m.id).length + 1), titolo, riassunto: String(L.riassunto || ''), letta: false, aggiunta: Date.now() };
        S.lezioni.push(lez);
      }
      res.lezioni++;
      for (const c of L.crocette || []) {
        const d = String(c.domanda || c.d || '').trim();
        const o = (c.opzioni || c.o || []).map(x => String(x).trim()).filter(Boolean);
        const g = indiceGiusta(c.giusta != null ? c.giusta : (c.g != null ? c.g : c.risposta), o);
        if (!d || o.length < 2 || g < 0) { res.scartate++; continue; }
        S.crocette.push({ id: vecchieC.get(norm(d)) || uid(), mid: m.id, lid: lez.id, d, o, g, s: String(c.spiegazione || c.s || '') });
        res.crocette++;
      }
      for (const a of L.aperte || []) {
        const d = String(a.domanda || a.d || '').trim();
        let pt = a.scaletta || a.punti || a.p || [];
        if (typeof pt === 'string') pt = pt.split(/\n+/);
        pt = pt.map(x => String(x).replace(/^\s*[-•\d.)]+\s*/, '').trim()).filter(Boolean);
        if (!d) { res.scartate++; continue; }
        S.aperte.push({ id: vecchieA.get(norm(d)) || uid(), mid: m.id, lid: lez.id, d, p: pt });
        res.aperte++;
      }
    }
  }
  if (!res.lezioni) throw new Error('Il pacchetto non contiene lezioni');
  save();
  return res;
}

/* ---------------- scadenze ---------------- */
const TIPI_S = {
  retta: { label: 'Retta', icon: 'euro', agenda: 'pagamento', colore: '#2e8b57' },
  appello: { label: 'Prenotazione appello', icon: 'flag', agenda: 'scadenza', colore: '#cf4b3f' },
  esame: { label: 'Esame', icon: 'cap', agenda: 'appuntamento', colore: '#2f6f5e' },
  lezione: { label: 'Lezione di approfondimento', icon: 'video', agenda: 'appuntamento', colore: '#3b6fd8' },
  tesi: { label: 'Tesi', icon: 'pen', agenda: 'scadenza', colore: '#c4912a' },
  altro: { label: 'Altro', icon: 'dots', agenda: 'scadenza', colore: '#76807b' }
};
function prossime(giorni) {
  const lim = addD(oggi(), giorni);
  return S.scad.filter(s => !s.fatto && s.data >= oggi() && s.data <= lim).sort((a, b) => (a.data + (a.ora || '')).localeCompare(b.data + (b.ora || '')));
}
function scaduteNonFatte() { return S.scad.filter(s => !s.fatto && s.data < oggi() && s.tipo !== 'esame' && s.tipo !== 'lezione'); }

/* ---------------- email dell'università ---------------- */
const MESI_N = { gennaio: 1, gen: 1, febbraio: 2, feb: 2, marzo: 3, mar: 3, aprile: 4, apr: 4, maggio: 5, mag: 5, giugno: 6, giu: 6, luglio: 7, lug: 7, agosto: 8, ago: 8,
  settembre: 9, set: 9, sett: 9, ottobre: 10, ott: 10, novembre: 11, nov: 11, dicembre: 12, dic: 12 };
const REGOLE_TIPO = [
  ['retta', /\b(rett[ae]|rat[ae]|tass[ae]|contribut\w*|pagament\w*|pagopa|pago pa|iuv|mav|bollettin\w*|ravvediment\w*|mora)\b/i],
  ['appello', /\b(appell\w*|prenotazion\w* (dell'|agli |all'|degli )?esam\w*|iscrizion\w* (all'|agli )?esam\w*|sessione d.esam\w*|calendario (degli )?esami|prenota\w* l.esame)\b/i],
  ['lezione', /\b(lezion\w*|webinar|approfondiment\w*|in diretta|live|seminari\w*|laborator\w*|ricevimento|incontro online|aula virtuale)\b/i],
  ['esame', /\b(esame|esami|prova scritta|prova orale|convocazion\w*)\b/i]
];
function tipoEmail(testo) {
  for (const [t, re] of REGOLE_TIPO) if (re.test(testo)) return t;
  return 'altro';
}
function estraiDate(t, rif) {
  const out = []; let m;
  const re1 = /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/g;
  while ((m = re1.exec(t))) { let y = +m[3]; if (y < 100) y += 2000; out.push({ g: +m[1], m: +m[2], a: y, pos: m.index, len: m[0].length }); }
  const re2 = /\b(\d{1,2})\s*(?:°\s*)?(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|sett?|ott|nov|dic)\.?(?:\s+(\d{4}))?\b/gi;
  while ((m = re2.exec(t))) {
    const mese = MESI_N[m[2].toLowerCase()]; let anno = m[3] ? +m[3] : rif.getFullYear();
    if (!m[3] && new Date(anno, mese - 1, +m[1]) < new Date(rif.getFullYear(), rif.getMonth(), rif.getDate())) anno++;
    out.push({ g: +m[1], m: mese, a: anno, pos: m.index, len: m[0].length });
  }
  return out.filter(d => d.g >= 1 && d.g <= 31 && d.m >= 1 && d.m <= 12 && d.a >= 2020 && d.a <= 2100).sort((a, b) => a.pos - b.pos);
}
function orario(t, pos) {
  const f = t.slice(pos, pos + 80);
  const m = f.match(/\b(?:ore|alle|alle ore|h\.?|dalle)\s*(\d{1,2})(?:[:.](\d{2}))?\b/i) || f.match(/\b(\d{1,2})[:.](\d{2})\b(?![\/.\-]\d)/);
  if (!m) return '';
  const h = +m[1], mi = m[2] ? +m[2] : 0;
  return h > 23 || mi > 59 ? '' : pad(h) + ':' + pad(mi);
}
function proponi(email) {
  const testo = (email.subject || '') + '\n' + (email.body || '');
  const tipo = tipoEmail(testo);
  const rif = new Date(email.date || Date.now()), inizio = oggi();
  const date = estraiDate(testo, rif).map(d => {
    const data = d.a + '-' + pad(d.m) + '-' + pad(d.g);
    const prima = testo.slice(Math.max(0, d.pos - 70), d.pos).toLowerCase();
    let punti = 0;
    if (/(entro|scadenza|scade|termine|non oltre|fino al|chiusura|apertura)/.test(prima)) punti += 3;
    if (/(il giorno|in data|si terr|previst|appello del|lezione del|alle ore|dalle)/.test(prima)) punti += 2;
    if (/(emess|inviat|protocollo|del giorno \d|nat[oa])/.test(prima)) punti -= 4;
    return { data, ora: orario(testo, d.pos + d.len), punti, pos: d.pos };
  }).filter(d => d.data >= inizio);
  date.sort((a, b) => b.punti - a.punti || a.pos - b.pos);
  const scelta = date[0] || null;
  const sogg = String(email.subject || '').replace(/^(re|fw|fwd|i|r)\s*:\s*/gi, '').trim();
  const mid = (S.materie.find(m => norm(testo).includes(norm(m.nome))) || {}).id || '';
  return { tipo, data: scelta ? scelta.data : '', ora: scelta ? scelta.ora : '', titolo: (TIPI_S[tipo].label !== 'Altro' && !norm(sogg).includes(norm(TIPI_S[tipo].label).split(' ')[0]) ? TIPI_S[tipo].label + ': ' : '') + (sogg || 'Comunicazione università'), mid, altre: date.slice(1, 4).map(d => d.data) };
}
async function chiamaScript(corpo) {
  const e = S.imp.email;
  if (!e.url) throw new Error('Manca l\'indirizzo dello script');
  const r = await fetch(e.url, { method: 'POST', body: JSON.stringify(Object.assign({ token: e.codice }, corpo)), redirect: 'follow' });
  const j = await r.json();
  if (j.error === 'token') throw new Error('Codice segreto sbagliato');
  if (j.error) throw new Error(j.error);
  return j;
}
let controlloInCorso = false;
async function controllaEmail(manuale) {
  const e = S.imp.email;
  if (!e.url || !e.mittenti.length || controlloInCorso) { if (manuale && !e.mittenti.length) toast('Aggiungi almeno un mittente dell\'università'); return; }
  if (!manuale && Date.now() - (e.ultimo || 0) < 20 * 60000) return;
  controlloInCorso = true;
  if (manuale) toast('Controllo le email…');
  try {
    const j = await chiamaScript({ azione: 'email', mittenti: e.mittenti, giorni: e.giorni || 60 });
    let nuove = 0;
    for (const em of j.emails || []) {
      if (S.posta.some(p => p.id === em.id)) continue;
      S.posta.push({ id: em.id, from: em.from, subject: em.subject, date: em.date, body: String(em.body || '').slice(0, 3000), link: em.link || '', stato: 'nuova', prop: proponi(em) });
      nuove++;
    }
    S.posta.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    S.posta = S.posta.slice(0, 150);
    e.ultimo = Date.now();
    save(); render();
    if (manuale || nuove) toast(nuove ? `📬 ${nuove} nuov${nuove === 1 ? 'a email' : 'e email'} dall'università` : 'Nessuna email nuova');
    if (nuove && document.hidden) notifica('Email dall\'università', nuove + ' da controllare in StudioFacile', 'posta');
  } catch (err) {
    if (manuale) toast('Email: ' + err.message);
  } finally { controlloInCorso = false; }
}
const postaNuove = () => S.posta.filter(p => p.stato === 'nuova').length;

/* ---------------- notifiche e promemoria ---------------- */
function notifica(titolo, testo, tag) {
  if (!S.imp.notifiche || !('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body: testo, tag: tag || 'sf', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' };
  if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.ready.then(r => r.showNotification(titolo, opts)).catch(() => {});
  else try { new Notification(titolo, opts); } catch (e) { /* no */ }
}
function controllaPromemoria() {
  let cambiato = false;
  for (const s of prossime(S.imp.avvisoGiorni || 3)) {
    const k = s.id + '@' + s.data;
    if (S.notificati[k]) continue;
    S.notificati[k] = Date.now(); cambiato = true;
    notifica(TIPI_S[s.tipo].label + ' ' + quandoTra(s.data), s.titolo + (s.ora ? ' · ore ' + s.ora : ''), k);
  }
  const ora = new Date(), hm = pad(ora.getHours()) + ':' + pad(ora.getMinutes());
  const m = materiaAttiva();
  if (m && giornoStudio()) {
    const { sedute } = passiDiOggi(m);
    sedute.forEach(sd => {
      const k = 'studio@' + oggi() + '#' + sd.i;
      if (hm < sd.ora || S.notificati[k] || sd.passi.every(p => fattoOggi(p.id))) return;
      S.notificati[k] = Date.now(); cambiato = true;
      notifica('È il momento dei tuoi ' + S.imp.minuti + ' minuti', m.nome + (sedute.length > 1 ? ': seduta ' + (sd.i + 1) + ' di ' + sedute.length : ': la seduta di oggi ti aspetta'), 'studio');
    });
  }
  if (cambiato) {
    const lim = Date.now() - 60 * 86400000;
    Object.keys(S.notificati).forEach(k => { if (S.notificati[k] < lim) delete S.notificati[k]; });
    save();
  }
}

/* ---------------- interfaccia ---------------- */
const ui = { tab: 'oggi', apertaMateria: '' };
function toast(t, ms) {
  const el = $('#toast'); el.textContent = t; el.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), ms || 2800);
}
const TABS = [['oggi', 'Oggi', 'home'], ['libretto', 'Libretto', 'book'], ['scadenze', 'Scadenze', 'cal'], ['tesi', 'Tesi', 'cap'], ['altro', 'Altro', 'gear']];
function renderTab() {
  const n = postaNuove() + scaduteNonFatte().length;
  $('#tabbar').innerHTML = TABS.map(([id, lbl, ic]) => `<button class="tab ${ui.tab === id ? 'on' : ''}" data-act="tab" data-v="${id}">${I(ic)}${lbl}${id === 'scadenze' && n ? `<span class="dot">${n}</span>` : ''}</button>`).join('');
  const d = new Date();
  $('#brand-sub').textContent = GIORNI[d.getDay()] + ' ' + d.getDate() + ' ' + MESI[d.getMonth()];
}
function render() {
  renderTab();
  const v = { oggi: vOggi, libretto: ui.apertaMateria ? vMateria : vLibretto, scadenze: vScadenze, tesi: vTesi, altro: vAltro }[ui.tab] || vOggi;
  $('#view').innerHTML = v();
}

/* ----- Oggi ----- */
function vOggi() {
  const m = materiaAttiva();
  const nome = S.imp.nome ? ', ' + esc(S.imp.nome) : '';
  const h = new Date().getHours();
  const saluto = (h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera') + nome;
  const N = Math.max(1, Math.min(3, +S.imp.sedute || 1));
  let html = `<div class="hello"><h1>${saluto}</h1><p>${giornoStudio() || (S.oggi.data === oggi() && S.oggi.forza) ? (N > 1 ? N + ' sedute da ' + S.imp.minuti + ' minuti' : S.imp.minuti + ' minuti') + ' oggi, e un esame alla volta.' : 'Oggi è giorno libero.'}</p></div>`;
  html += bannerScadenze();
  if (!m) {
    if (!S.materie.length) return html + `<div class="card empty"><h3>Iniziamo dal primo esame</h3><p>Scegli l'esame più facile, non il più importante. Aggiungilo e importa il pacchetto che ti preparo da Claude.</p>
      <div class="btns"><button class="btn pri" data-act="materia-nuova">${I('plus')}Aggiungi esame</button><button class="btn" data-act="importa">${I('upload')}Importa pacchetto</button></div>
      <p class="small" style="margin-top:14px">Vuoi provare subito? <button class="btn ghost sm" data-act="esempio">Carica un esempio</button></p></div>` + vProgressi();
    return html + `<div class="card empty"><h3>Nessun esame in corso</h3><p>Hai superato tutto quello che avevi in lista. Aggiungi il prossimo esame.</p><div class="btns"><button class="btn pri" data-act="materia-nuova">${I('plus')}Prossimo esame</button></div></div>` + vProgressi();
  }
  const { p, passi, sedute } = passiDiOggi(m);
  const fatti = passi.filter(x => fattoOggi(x.id)).length;
  const libero = !giornoStudio() && !(S.oggi.data === oggi() && S.oggi.forza);
  html += `<div class="card hero">
    <div class="row"><div class="g"><span class="chip">${p.senzaData ? 'Piano di 4 settimane' : 'Settimana ' + Math.min(p.settimana, Math.ceil(p.tot / 7)) + ' di ' + Math.ceil(p.tot / 7)}</span><h2 style="margin-top:8px">${esc(m.nome)}</h2>
    <p class="sub">${p.es ? 'Esame ' + fData(p.es.data, true) + (p.es.ora ? ' alle ' + p.es.ora : '') : 'Nessuna data d\'esame ancora'}</p></div></div>
    <div class="countdown"><div><b>${p.es ? p.mancano : '—'}</b><span>giorni all'esame</span></div><div><b>${p.lez.filter(l => l.letta).length}/${p.lez.length}</b><span>lezioni lette</span></div><div><b>${serie()}</b><span>giorni di fila</span></div></div>
    <div class="phases">${FASI.map((f, i) => `<i class="${i < p.fase ? 'done' : i === p.fase ? 'now' : ''}"></i>`).join('')}</div>
    <div class="phase-lbl"><span>Fase: ${FASI[p.fase]}</span><span>${FASI[Math.min(3, p.fase + 1)] !== FASI[p.fase] ? 'poi ' + FASI[p.fase + 1] : 'ultimo tratto'}</span></div>
    ${p.senzaData ? `<div class="btns"><button class="btn acc sm" data-act="esame-data" data-id="${m.id}">${I('cal')}Imposta la data dell'esame</button></div>` : ''}
  </div>`;
  const btnPasso = x => {
    const done = fattoOggi(x.id);
    return `<button class="step ${done ? 'done' : ''}" data-act="passo" data-v="${x.id}"><span class="n">${done ? I('check') : I({ lettura: 'read', crocette: 'quiz', aperte: 'mic', sim: 'timer', import: 'upload' }[x.tipo])}</span>
      <span class="g" style="flex:1;min-width:0"><b>${esc(x.titolo)}</b><span>${esc(x.desc)}</span></span>${done ? '' : I('next', 'go')}</button>`;
  };
  if (libero) {
    html += `<div class="card"><div class="light giallo"><span class="bulb">${I('sun')}</span><div class="g"><h3>Oggi è giorno libero</h3><p class="sub">L'hai scelto tu nelle impostazioni. Riposare fa parte del piano.</p></div></div>
      <div class="btns"><button class="btn" data-act="studia-comunque">${I('read')}Studio lo stesso</button></div></div>`;
  } else if (sedute.length === 1) {
    html += `<div class="sec-t"><h2>La seduta di oggi</h2><span class="muted small">${fatti}/${passi.length} fatti</span></div>` + passi.map(btnPasso).join('');
  } else {
    html += `<div class="sec-t"><h2>Le ${sedute.length} sedute di oggi</h2><span class="muted small">${fatti}/${passi.length} fatti</span></div>`;
    html += sedute.map(sd => {
      const ok = sd.passi.every(x => fattoOggi(x.id));
      return `<div class="seduta"><div class="seduta-h"><b>Seduta ${sd.i + 1}</b><span class="chip ${ok ? 'ok' : ''}">${ok ? 'fatta' : 'alle ' + esc(sd.ora)}</span></div>${sd.passi.map(btnPasso).join('')}</div>`;
    }).join('');
  }
  if (!libero && passi.length && fatti === passi.length) html += `<div class="allset">${I('check')}${sedute.length > 1 ? 'Sedute completate' : 'Seduta completata'}. ${serie()} giorn${serie() === 1 ? 'o' : 'i'} di studio di fila.</div>`;
  const pr = pronto(m.id);
  html += `<div class="card"><div class="light ${pr.c}"><span class="bulb">${I(pr.c === 'verde' ? 'check' : 'timer')}</span><div class="g"><h3>${pr.t}</h3><p class="sub">${pr.d}</p></div></div>
    ${pr.c === 'verde' && !p.es ? `<div class="btns"><button class="btn ok" data-act="esame-data" data-id="${m.id}">${I('cal')}Ho prenotato: inserisci la data</button></div>` : ''}</div>`;
  const alt = S.materie.filter(x => x.stato === 'studio' && x.id !== m.id);
  if (alt.length) html += `<p class="small muted" style="text-align:center">Stai preparando anche ${alt.map(x => esc(x.nome)).join(', ')}. <button class="btn ghost sm" data-act="cambia-focus">Cambia esame</button></p>`;
  return html + vProgressi();
}
function bannerScadenze() {
  let h = '';
  const sc = scaduteNonFatte();
  if (sc.length) h += `<button class="banner bad" data-act="tab" data-v="scadenze">${I('flag')}<span>${sc.length} scadenz${sc.length === 1 ? 'a passata' : 'e passate'} non segnat${sc.length === 1 ? 'a' : 'e'} come fatt${sc.length === 1 ? 'a' : 'e'}</span></button>`;
  const pr = prossime(7)[0];
  if (pr) h += `<button class="banner" data-act="scad-apri" data-id="${pr.id}">${I(TIPI_S[pr.tipo].icon)}<span>${esc(TIPI_S[pr.tipo].label)} ${quandoTra(pr.data)}: ${esc(pr.titolo)}</span></button>`;
  const np = postaNuove();
  if (np) h += `<button class="banner" data-act="tab" data-v="scadenze">${I('mail')}<span>${np} email dall'università da controllare</span></button>`;
  return h;
}
function vProgressi() {
  const md = medie(), tot = +S.imp.totCfu || 180;
  let minSett = 0; for (let i = 0; i < 7; i++) minSett += (S.log[addD(oggi(), -i)] || {}).min || 0;
  return `<div class="sec-t"><h2>I tuoi progressi</h2><button class="lnk" data-act="tab" data-v="libretto">Libretto</button></div><div class="card"><div class="stats">
    <div class="stat"><b>${md.sup.length}</b><span>esami passati</span></div><div class="stat"><b>${md.cfuTot}</b><span>CFU su ${tot}</span></div><div class="stat"><b>${Math.round(minSett)}'</b><span>studio in 7 giorni</span></div></div>
    <div class="bar"><i style="width:${Math.min(100, md.cfuTot / tot * 100)}%"></i></div><p class="sub" style="margin-top:8px">${md.pond ? 'Media ponderata ' + md.pond.toFixed(2) + ' · ' : ''}${Math.round(md.cfuTot / tot * 100)}% del percorso</p></div>`;
}

/* ----- Materie ----- */
const STATI = { studio: 'In preparazione', pausa: 'Da sostenere', superato: 'Superato' };
const votoTxt = m => m.valutazione === 'idoneita' ? 'Idoneo' : m.voto ? (+m.voto >= 30 && m.lode ? '30L' : m.voto) : '—';
function medie() {
  const sup = S.materie.filter(m => m.stato === 'superato');
  const conVoto = sup.filter(m => m.valutazione !== 'idoneita' && +m.voto >= 18);
  const cfuTot = sup.reduce((a, m) => a + (+m.cfu || 0), 0) + (S.tesi && S.tesi.stato === 'discussa' ? +S.tesi.cfu || 0 : 0);
  const v = m => Math.min(30, +m.voto); // la lode vale 30 nelle medie
  const arit = conVoto.length ? conVoto.reduce((a, m) => a + v(m), 0) / conVoto.length : 0;
  const pesoTot = conVoto.reduce((a, m) => a + (+m.cfu || 0), 0);
  const pond = pesoTot ? conVoto.reduce((a, m) => a + v(m) * (+m.cfu || 0), 0) / pesoTot : 0;
  return { sup, conVoto, cfuTot, arit, pond, base: pond * 110 / 30, lodi: conVoto.filter(m => m.lode && +m.voto >= 30).length };
}
function vLibretto() {
  const f = ui.filtro || 'tutti', md = medie(), tot = +S.imp.totCfu || 180;
  const cfuPiano = S.materie.reduce((a, m) => a + (+m.cfu || 0), 0) + (S.tesi ? +S.tesi.cfu || 0 : 0);
  let h = `<div class="hello"><h1>Libretto</h1><p>Il tuo piano di studi: materie, CFU, esami passati e voti.</p></div>
    <div class="card"><div class="stats"><div class="stat"><b>${md.sup.length}<small style="font-size:14px;opacity:.6">/${S.materie.length}</small></b><span>esami passati</span></div><div class="stat"><b>${md.cfuTot}</b><span>CFU su ${tot}</span></div><div class="stat"><b>${md.pond ? md.pond.toFixed(2) : '—'}</b><span>media ponderata</span></div></div>
    <div class="bar"><i style="width:${Math.min(100, md.cfuTot / tot * 100)}%"></i></div>
    <div class="libro-tot"><span>Media aritmetica <b>${md.arit ? md.arit.toFixed(2) : '—'}</b></span><span>Base di laurea <b>${md.pond ? md.base.toFixed(1) + '/110' : '—'}</b></span>${md.lodi ? `<span>Lodi <b>${md.lodi}</b></span>` : ''}</div>
    ${cfuPiano && cfuPiano !== tot ? `<p class="small muted" style="margin:8px 0 0">Nel piano hai inserito ${cfuPiano} CFU su ${tot}${cfuPiano < tot ? ': aggiungi le materie che mancano.' : '.'}</p>` : ''}</div>
    <div class="btns" style="margin-top:0"><button class="btn pri" data-act="materia-nuova">${I('plus')}Materia</button><button class="btn" data-act="piano-incolla">${I('list')}Piano di studi</button><button class="btn" data-act="importa">${I('upload')}Importa</button></div>`;
  if (!S.materie.length) return h + `<div class="card empty"><h3>Il libretto è vuoto</h3><p>Incolla il tuo piano di studi (lo trovi nell'area studenti) o aggiungi le materie una alla volta. Per gli esami già passati inserisci il voto.</p><button class="btn ghost" data-act="esempio">Oppure carica un esempio</button></div>`;
  h += `<div class="seg filtri">${[['tutti', 'Tutte'], ['studio', 'In preparazione'], ['pausa', 'Da sostenere'], ['superato', 'Superati']].map(([v, l]) => `<button data-act="filtro" data-v="${v}" class="${f === v ? 'on' : ''}">${l} <span>${v === 'tutti' ? S.materie.length : S.materie.filter(m => m.stato === v).length}</span></button>`).join('')}</div>`;
  const anni = [...new Set(S.materie.map(m => m.anno || ''))].sort((a, b) => (a || '9').localeCompare(b || '9'));
  for (const anno of anni) {
    const ms = S.materie.filter(m => (m.anno || '') === anno && (f === 'tutti' || m.stato === f))
      .sort((a, b) => ['studio', 'pausa', 'superato'].indexOf(a.stato) - ['studio', 'pausa', 'superato'].indexOf(b.stato) || a.nome.localeCompare(b.nome));
    if (!ms.length) continue;
    const cfuA = ms.reduce((a, m) => a + (+m.cfu || 0), 0);
    h += `<div class="sec-t"><h2>${anno ? anno + '° anno' : anni.length > 1 ? 'Anno non indicato' : 'Materie'}</h2><span class="muted small">${cfuA} CFU</span></div><div class="card libro">` + ms.map(m => {
      const es = esameDi(m.id), pr = m.stato === 'studio' ? pronto(m.id) : null;
      return `<button class="riga" data-act="materia" data-id="${m.id}"><span class="dotc" style="background:${m.colore}"></span>
        <span class="g"><b>${esc(m.nome)}</b><span>${m.cfu ? m.cfu + ' CFU' : 'CFU ?'} · ${m.stato === 'superato' ? (m.dataSup ? 'superato il ' + fData(m.dataSup) : 'superato') : STATI[m.stato] + (es ? ' · esame ' + fData(es.data) : '') + (pr ? ' · ' + pr.perc + '% consolidato' : '')}</span></span>
        <span class="voto-b ${m.stato === 'superato' ? 'si' : m.stato === 'studio' ? 'in' : ''}">${m.stato === 'superato' ? votoTxt(m) : m.id === S.focus && m.stato === 'studio' ? I('read') : ''}</span></button>`;
    }).join('') + `</div>`;
  }
  if (S.tesi) h += `<div class="sec-t"><h2>Prova finale</h2></div><div class="card libro"><button class="riga" data-act="tab" data-v="tesi"><span class="dotc" style="background:var(--accent)"></span><span class="g"><b>Tesi${S.tesi.titolo ? ': ' + esc(S.tesi.titolo) : ''}</b><span>${S.tesi.cfu ? S.tesi.cfu + ' CFU · ' : ''}${esc(TESI_STATI[S.tesi.stato] || '')}</span></span><span class="voto-b ${S.tesi.stato === 'discussa' ? 'si' : ''}">${S.tesi.stato === 'discussa' && S.tesi.votoLaurea ? esc(S.tesi.votoLaurea) : ''}</span></button></div>`;
  return h;
}
function formPiano() {
  const sh = sheet('Piano di studi', `<p class="sub">Una materia per riga: <strong>nome; CFU; anno</strong>. Anno e CFU sono facoltativi. Puoi copiare la tabella dall'area studenti: le colonne separate da tabulazione vanno bene.</p>
    <div class="field"><textarea class="inp" id="p-testo" style="min-height:180px" placeholder="Anatomia umana; 9; 1&#10;Fisiologia; 9; 1&#10;Teoria e metodologia dell'allenamento; 12; 2"></textarea></div>
    <div class="btns"><button class="btn pri block" id="p-ok">Aggiungi al libretto</button></div>
    <p class="small muted" style="margin-top:10px">Le materie che hai già non vengono duplicate (aggiorno solo CFU e anno se mancano). Poi apri ogni esame già passato e inserisci il voto.</p>`);
  sh.querySelector('#p-ok').onclick = () => {
    let n = 0, agg = 0;
    sh.querySelector('#p-testo').value.split('\n').forEach(r => {
      const c = r.split(/\t|;|\s[-–|]\s/).map(x => x.trim()).filter(Boolean);
      if (!c.length || c[0].length < 2) return;
      const nome = c[0].replace(/^\d+[.)]\s*/, '');
      const num = c.slice(1).map(x => parseInt(x, 10)).filter(x => !isNaN(x));
      // ordine: CFU poi anno (se c'è un numero solo è il CFU)
      const cfu = num[0] > 0 && num[0] <= 60 ? num[0] : '';
      const anno = num[1] >= 1 && num[1] <= 6 ? num[1] : '';
      const ex = S.materie.find(m => norm(m.nome) === norm(nome));
      if (ex) { if (!ex.cfu && cfu) ex.cfu = cfu; if (!ex.anno && anno) ex.anno = String(anno); agg++; return; }
      const focus = S.focus;
      nuovaMateria(nome, { cfu, anno: anno ? String(anno) : '', stato: 'pausa' });
      S.focus = focus; n++;
    });
    if (!n && !agg) { toast('Non ho trovato materie nel testo'); return; }
    save(); chiudiSheet(); ui.filtro = 'tutti'; render(); toast(`${n} materi${n === 1 ? 'a aggiunta' : 'e aggiunte'}${agg ? ', ' + agg + ' già presenti' : ''}`);
  };
}
function vMateria() {
  const m = mat(ui.apertaMateria);
  if (!m) { ui.apertaMateria = ''; return vLibretto(); }
  const lez = lezDi(m.id), cro = croDi(m.id), ape = apeDi(m.id), es = esameDi(m.id);
  const sims = S.sim.filter(s => s.mid === m.id).slice(-5).reverse();
  const daRip = cro.filter(c => vista(c.id) && srs(c.id).due <= oggi()).length;
  let h = `<button class="btn ghost" data-act="materie-indietro" style="margin-left:-10px">${I('back')}Libretto</button>
    <div class="row"><span class="dotc" style="background:${m.colore};width:16px;height:16px"></span><h1 class="g" style="font-size:25px">${esc(m.nome)}</h1><button class="x" data-act="materia-modifica" data-id="${m.id}" aria-label="Modifica">${I('edit')}</button></div>
    <p class="muted" style="margin:4px 0 0">${m.cfu ? m.cfu + ' CFU · ' : ''}${m.anno ? m.anno + '° anno · ' : ''}${m.stato === 'superato' ? (m.valutazione === 'idoneita' ? 'Idoneità ottenuta' : 'Superato' + (m.voto ? ' con ' + votoTxt(m) : '')) + (m.dataSup ? ' il ' + fData(m.dataSup) : '') : m.stato === 'pausa' ? 'Da sostenere · <button class="btn ghost sm" data-act="inizia" data-id="' + m.id + '">Inizia a prepararlo</button>' : es ? 'Esame ' + fData(es.data, true) : 'Data d\'esame da inserire'}</p>`;
  if (m.stato === 'studio') h += `<div class="btns"><button class="btn pri" data-act="quiz" data-id="${m.id}" ${cro.length ? '' : 'disabled'}>${I('quiz')}Crocette${daRip ? ' (' + daRip + ')' : ''}</button><button class="btn" data-act="aperte" data-id="${m.id}" ${ape.length ? '' : 'disabled'}>${I('mic')}Aperte</button><button class="btn" data-act="sim" data-id="${m.id}" ${cro.length >= 5 ? '' : 'disabled'}>${I('timer')}Simulazione</button></div>`;
  h += `<div class="card"><div class="stats"><div class="stat"><b>${cro.length}</b><span>crocette</span></div><div class="stat"><b>${cro.filter(c => padroneggiata(c.id)).length}</b><span>consolidate</span></div><div class="stat"><b>${ape.length}</b><span>aperte</span></div></div></div>`;
  h += `<div class="sec-t"><h2>Lezioni</h2><span><button class="lnk" data-act="appunti-nuovi">+ Appunti</button> <button class="lnk" data-act="importa">+ Importa</button></span></div>`;
  h += lez.length ? `<div class="card" style="padding:4px 14px">${lez.map(l => `<button class="item" data-act="leggi" data-id="${l.id}"><span class="ic" style="${l.letta ? 'background:var(--ok-soft);color:var(--ok)' : ''}">${I(l.letta ? 'check' : l.fonte === 'mio' ? 'pen' : 'read')}</span><span class="g"><b>${l.n ? l.n + '. ' : ''}${esc(l.titolo)}</b><span>${S.crocette.filter(c => c.lid === l.id).length} crocette · ${S.aperte.filter(a => a.lid === l.id).length} aperte${l.letta ? ' · letta' : ''}</span></span>${I('next')}</button>`).join('')}</div>`
    : `<div class="card empty"><p>Nessuna lezione. Carica le slide in Claude (progetto "SF · ${esc(m.nome)}") e importa qui il pacchetto.</p><button class="btn ghost" data-act="istruzioni">Come si fa</button></div>`;
  if (sims.length) h += `<div class="sec-t"><h2>Simulazioni</h2></div><div class="card" style="padding:4px 14px">${sims.map(s => `<div class="item"><span class="ic" style="background:${s.voto >= 18 ? 'var(--ok-soft)' : 'var(--bad-soft)'};color:${s.voto >= 18 ? 'var(--ok)' : 'var(--bad)'}"><b style="font-size:15px">${s.voto}</b></span><span class="g"><b>${s.ok}/${s.tot} giuste</b><span>${fData(s.data, true)}${s.min ? ' · ' + s.min + ' min' : ''}</span></span></div>`).join('')}</div>`;
  if (m.stato !== 'superato') h += `<div class="btns"><button class="btn ok" data-act="superato" data-id="${m.id}">${I('cap')}Esame superato!</button></div>`;
  return h;
}

/* ----- Scadenze ----- */
function vScadenze() {
  let h = `<div class="hello"><h1>Scadenze</h1><p>Rette, appelli, esami e lezioni. Vanno anche in AgendApp con gli avvisi.</p></div>
    <div class="btns" style="margin-top:0"><button class="btn pri" data-act="scad-nuova">${I('plus')}Aggiungi</button>${S.imp.email.url ? `<button class="btn" data-act="email-controlla">${I('refresh')}Email</button>` : `<button class="btn" data-act="email-setup">${I('mail')}Collega email</button>`}</div>`;
  const nuove = S.posta.filter(p => p.stato === 'nuova');
  if (nuove.length) h += `<div class="sec-t"><h2>Dall'università</h2><span class="muted small">${nuove.length} da controllare</span></div>` + nuove.map(vMail).join('');
  const tutte = S.scad.slice().sort((a, b) => (a.data + (a.ora || '')).localeCompare(b.data + (b.ora || '')));
  const passate = tutte.filter(s => s.fatto || s.data < oggi()).reverse().slice(0, 15);
  const future = tutte.filter(s => !s.fatto && s.data >= oggi());
  const scad = scaduteNonFatte();
  if (scad.length) h += `<div class="sec-t"><h2>Da sistemare</h2></div><div class="card" style="padding:4px 14px">${scad.map(vScad).join('')}</div>`;
  h += `<div class="sec-t"><h2>In arrivo</h2></div>`;
  h += future.length ? `<div class="card" style="padding:4px 14px">${future.map(vScad).join('')}</div>` : `<div class="card empty"><p>Nessuna scadenza in arrivo.</p></div>`;
  const vecchie = passate.filter(s => !scad.includes(s));
  if (vecchie.length) h += `<div class="sec-t"><h2>Passate e fatte</h2></div><div class="card" style="padding:4px 14px">${vecchie.map(vScad).join('')}</div>`;
  const ign = S.posta.filter(p => p.stato !== 'nuova').length;
  if (ign) h += `<p class="small muted" style="text-align:center">${ign} email già gestite. <button class="btn ghost sm" data-act="posta-archivio">Vedi</button></p>`;
  return h;
}
function vScad(s) {
  const t = TIPI_S[s.tipo] || TIPI_S.altro, m = mat(s.mid);
  const spuntabile = s.tipo === 'retta' || s.tipo === 'appello' || s.tipo === 'tesi' || s.tipo === 'altro';
  return `<div class="item ${s.fatto ? 'fatto' : ''}">${spuntabile ? `<button class="check ${s.fatto ? 'on' : ''}" data-act="scad-fatto" data-id="${s.id}" aria-label="Fatto">${s.fatto ? I('check') : ''}</button>` : `<span class="ic" style="width:28px;height:28px;border-radius:9px;color:${t.colore}">${I(t.icon)}</span>`}
    <button class="g" data-act="scad-apri" data-id="${s.id}" style="border:0;background:none;text-align:left;padding:0"><b>${esc(s.titolo)}</b><span>${esc(t.label)} · ${fData(s.data, true)}${s.ora ? ' · ' + s.ora : ''}${m ? ' · ' + esc(m.nome) : ''}${!s.fatto && s.data >= oggi() ? ' · ' + quandoTra(s.data) : ''}</span></button></div>`;
}
function vMail(p) {
  const pr = p.prop || {};
  return `<div class="mail"><div class="from">${esc(String(p.from || '').replace(/<.*>/, '').replace(/"/g, '') || p.from)} · ${p.date ? fData(ds(new Date(p.date))) : ''}</div><b>${esc(p.subject || '(senza oggetto)')}</b>
    <div class="prop">${pr.data ? `Ti propongo: <strong>${esc(TIPI_S[pr.tipo].label)}</strong> ${fData(pr.data, true)}${pr.ora ? ' alle ' + pr.ora : ''}` : `Tipo: <strong>${esc(TIPI_S[pr.tipo || 'altro'].label)}</strong> · nessuna data trovata`}</div>
    <div class="btns" style="margin-top:10px"><button class="btn sm pri" data-act="mail-aggiungi" data-id="${esc(p.id)}">${I('plus')}${pr.data ? 'Controlla e aggiungi' : 'Aggiungi a mano'}</button><button class="btn sm" data-act="mail-leggi" data-id="${esc(p.id)}">${I('eye')}Leggi</button><button class="btn sm" data-act="mail-ignora" data-id="${esc(p.id)}">Ignora</button></div></div>`;
}

/* ----- Tesi ----- */
const TESI_STATI = { idea: 'Scelta dell\'argomento', assegnata: 'Assegnata dal relatore', scrittura: 'In scrittura', revisione: 'In revisione', consegnata: 'Consegnata', discussa: 'Discussa' };
const CAP_STATI = ['Da fare', 'Bozza', 'Scritto', 'Rivisto'];
const FASI_TESI = ['Scegliere l\'argomento e il relatore', 'Chiedere la tesi al relatore', 'Domanda di assegnazione tesi in segreteria', 'Indice approvato dal relatore', 'Raccogliere fonti e bibliografia', 'Scrivere tutti i capitoli', 'Revisione finale del relatore', 'Domanda di laurea', 'Consegna / deposito della tesi', 'Preparare la presentazione'];
function nuovaTesi() {
  return { titolo: '', argomento: '', relatore: '', correlatore: '', tipo: 'compilativa', cfu: '', stato: 'idea', sessione: '', votoLaurea: '', note: '', pagineObiettivo: '', fasi: FASI_TESI.map(t => ({ id: uid(), t, f: false })), capitoli: [] };
}
function vTesi() {
  const T = S.tesi;
  if (!T) return `<div class="hello"><h1>Tesi</h1><p>La prova finale, un passo alla volta.</p></div>
    <div class="card empty"><h3>Non hai ancora iniziato la tesi</h3><p>Quando sei pronto imposti argomento e relatore: trovi già la lista delle cose da fare, i capitoli e le scadenze (domanda di laurea, consegna) che vanno anche in AgendApp.</p>
    <div class="btns"><button class="btn pri" data-act="tesi-inizia">${I('pen')}Inizia la tesi</button></div></div>`;
  const fFatte = T.fasi.filter(f => f.f).length, capOk = T.capitoli.filter(c => c.st >= 2).length;
  const perc = Math.round(((fFatte / Math.max(1, T.fasi.length)) * 0.5 + (T.capitoli.length ? T.capitoli.reduce((a, c) => a + c.st / 3, 0) / T.capitoli.length : 0) * 0.5) * 100);
  const scad = S.scad.filter(x => x.tipo === 'tesi').sort((a, b) => a.data.localeCompare(b.data));
  return `<div class="hello"><h1>Tesi</h1><p>${esc(TESI_STATI[T.stato])}${T.sessione ? ' · sessione di laurea ' + fData(T.sessione) + ' (' + quandoTra(T.sessione) + ')' : ''}</p></div>
    <div class="card hero"><span class="chip">${T.tipo === 'sperimentale' ? 'Tesi sperimentale' : 'Tesi compilativa'}${T.cfu ? ' · ' + esc(T.cfu) + ' CFU' : ''}</span>
      <h2 style="margin-top:8px">${esc(T.titolo || 'Titolo da definire')}</h2><p class="sub">${T.relatore ? 'Relatore: ' + esc(T.relatore) : 'Relatore da scegliere'}${T.correlatore ? ' · Correlatore: ' + esc(T.correlatore) : ''}</p>
      <div class="countdown"><div><b>${perc}%</b><span>avanzamento</span></div><div><b>${fFatte}/${T.fasi.length}</b><span>passi fatti</span></div><div><b>${capOk}/${T.capitoli.length}</b><span>capitoli scritti</span></div></div>
      <div class="btns"><button class="btn acc sm" data-act="tesi-modifica">${I('edit')}Modifica dati</button></div></div>
    <div class="sec-t"><h2>Capitoli</h2><button class="lnk" data-act="cap-nuovo">+ Capitolo</button></div>
    ${T.capitoli.length ? `<div class="card libro">${T.capitoli.map((c, i) => `<div class="riga"><span class="ic cap-n">${i + 1}</span><button class="g" data-act="cap-modifica" data-id="${c.id}" style="border:0;background:none;text-align:left;padding:0"><b>${esc(c.t)}</b><span>${c.note ? esc(c.note.slice(0, 70)) : 'Tocca per note e titolo'}</span></button><button class="chip ${['', 'warn', 'brand', 'ok'][c.st]}" data-act="cap-stato" data-id="${c.id}" style="border:0">${CAP_STATI[c.st]}</button></div>`).join('')}</div>
      <p class="small muted" style="text-align:center;margin:6px 0 0">Tocca lo stato per farlo avanzare: Da fare → Bozza → Scritto → Rivisto.</p>`
      : `<div class="card empty"><p>Aggiungi i capitoli dell'indice, anche provvisori.</p><button class="btn ghost" data-act="tesi-claude">Fatti aiutare da Claude per l'indice</button></div>`}
    <div class="sec-t"><h2>Cosa fare</h2><span class="muted small">${fFatte}/${T.fasi.length}</span></div>
    <div class="card libro">${T.fasi.map(f => `<div class="riga ${f.f ? 'fatto' : ''}"><button class="check ${f.f ? 'on' : ''}" data-act="fase-tesi" data-id="${f.id}">${f.f ? I('check') : ''}</button><span class="g"><b style="${f.f ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(f.t)}</b></span><button class="x" data-act="fase-tesi-del" data-id="${f.id}" aria-label="Togli" style="width:30px;height:30px;font-size:17px">×</button></div>`).join('')}
      <div class="riga"><input class="inp" id="fase-nuova" placeholder="Aggiungi un passo…" style="flex:1"><button class="btn sm" data-act="fase-tesi-add">${I('plus')}</button></div></div>
    <div class="sec-t"><h2>Scadenze della tesi</h2><button class="lnk" data-act="scad-tesi">+ Scadenza</button></div>
    ${scad.length ? `<div class="card" style="padding:4px 14px">${scad.map(vScad).join('')}</div>` : `<div class="card empty"><p>Domanda di laurea, consegna, incontri con il relatore: aggiungili e ti arrivano anche in AgendApp.</p></div>`}
    <div class="sec-t"><h2>Appunti</h2></div>
    <div class="card"><textarea class="inp" id="tesi-note" style="min-height:140px" placeholder="Idee, fonti, cose da chiedere al relatore…">${esc(T.note)}</textarea></div>
    <div class="btns"><button class="btn" data-act="tesi-claude">${I('copy')}Copia per Claude: aiuto sulla tesi</button></div>`;
}
function formTesi() {
  const T = S.tesi;
  const sh = sheet('Dati della tesi', `
    <div class="field"><label>Titolo (anche provvisorio)</label><input class="inp" id="t-titolo" value="${esc(T.titolo)}"></div>
    <div class="field"><label>Argomento</label><textarea class="inp" id="t-arg" style="min-height:70px">${esc(T.argomento)}</textarea></div>
    <div class="two"><div class="field"><label>Relatore</label><input class="inp" id="t-rel" value="${esc(T.relatore)}"></div><div class="field"><label>Correlatore</label><input class="inp" id="t-corr" value="${esc(T.correlatore)}"></div></div>
    <div class="field"><label>Tipo</label><div class="seg" id="t-tipo"><button type="button" data-v="compilativa" class="${T.tipo !== 'sperimentale' ? 'on' : ''}">Compilativa</button><button type="button" data-v="sperimentale" class="${T.tipo === 'sperimentale' ? 'on' : ''}">Sperimentale</button></div></div>
    <div class="field"><label>Stato</label><select class="inp" id="t-stato">${Object.keys(TESI_STATI).map(k => `<option value="${k}" ${T.stato === k ? 'selected' : ''}>${TESI_STATI[k]}</option>`).join('')}</select></div>
    <div class="two"><div class="field"><label>CFU prova finale</label><input class="inp" id="t-cfu" type="number" value="${esc(T.cfu)}"></div><div class="field"><label>Sessione di laurea</label><input class="inp" id="t-sess" type="date" value="${esc(T.sessione)}"></div></div>
    <div class="field" id="t-voto-f" ${T.stato === 'discussa' ? '' : 'hidden'}><label>Voto di laurea</label><input class="inp" id="t-voto" value="${esc(T.votoLaurea)}" placeholder="Es. 104/110"></div>
    <div class="btns"><button class="btn pri block" id="t-ok">Salva</button></div>
    <div class="btns"><button class="btn bad block" id="t-del">${I('trash')}Cancella la tesi</button></div>`);
  let tipo = T.tipo;
  sh.querySelector('#t-tipo').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; tipo = b.dataset.v; sh.querySelectorAll('#t-tipo button').forEach(x => x.classList.toggle('on', x === b)); });
  sh.querySelector('#t-stato').onchange = e => { sh.querySelector('#t-voto-f').hidden = e.target.value !== 'discussa'; };
  sh.querySelector('#t-ok').onclick = () => {
    Object.assign(T, { titolo: sh.querySelector('#t-titolo').value.trim(), argomento: sh.querySelector('#t-arg').value.trim(), relatore: sh.querySelector('#t-rel').value.trim(), correlatore: sh.querySelector('#t-corr').value.trim(),
      tipo, stato: sh.querySelector('#t-stato').value, cfu: sh.querySelector('#t-cfu').value, sessione: sh.querySelector('#t-sess').value, votoLaurea: sh.querySelector('#t-voto').value.trim() });
    // la sessione di laurea va anche tra le scadenze (e quindi in AgendApp)
    let sc = S.scad.find(x => x.tipo === 'tesi' && x.fonte === 'sessione');
    if (T.sessione) { if (!sc) { sc = { id: uid(), tipo: 'tesi', fonte: 'sessione', mid: '', ora: '', note: '', fatto: false, fattoTs: 0 }; S.scad.push(sc); } sc.data = T.sessione; sc.titolo = 'Sessione di laurea'; }
    else if (sc) S.scad = S.scad.filter(x => x !== sc);
    save(); chiudiSheet(); render(); toast('Tesi salvata');
  };
  sh.querySelector('#t-del').onclick = () => { if (!confirm('Cancello tutti i dati della tesi?')) return; S.tesi = null; S.scad = S.scad.filter(x => x.tipo !== 'tesi'); save(); chiudiSheet(); render(); };
}
function formCapitolo(c) {
  const T = S.tesi, nuovo = !c;
  c = c || { id: uid(), t: '', st: 0, note: '' };
  const sh = sheet(nuovo ? 'Nuovo capitolo' : 'Capitolo', `<div class="field"><label>Titolo</label><input class="inp" id="c-t" value="${esc(c.t)}" placeholder="Es. 1. Fisiologia del recupero"></div>
    <div class="field"><label>Stato</label><div class="seg" id="c-st">${CAP_STATI.map((l, i) => `<button type="button" data-v="${i}" class="${c.st === i ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <div class="field"><label>Note</label><textarea class="inp" id="c-note" placeholder="Fonti, punti da trattare, osservazioni del relatore…">${esc(c.note)}</textarea></div>
    <div class="btns"><button class="btn pri block" id="c-ok">Salva</button></div>${nuovo ? '' : `<div class="btns"><button class="btn" id="c-su">Sposta su</button><button class="btn bad" id="c-del">${I('trash')}Elimina</button></div>`}`);
  let st = c.st;
  sh.querySelector('#c-st').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st = +b.dataset.v; sh.querySelectorAll('#c-st button').forEach(x => x.classList.toggle('on', x === b)); });
  sh.querySelector('#c-ok').onclick = () => { const t = sh.querySelector('#c-t').value.trim(); if (!t) { toast('Scrivi il titolo'); return; } Object.assign(c, { t, st, note: sh.querySelector('#c-note').value }); if (nuovo) T.capitoli.push(c); save(); chiudiSheet(); render(); };
  const d = sh.querySelector('#c-del'); if (d) d.onclick = () => { T.capitoli = T.capitoli.filter(x => x !== c); save(); chiudiSheet(); render(); };
  const su = sh.querySelector('#c-su'); if (su) su.onclick = () => { const i = T.capitoli.indexOf(c); if (i > 0) { T.capitoli.splice(i, 1); T.capitoli.splice(i - 1, 0, c); save(); } chiudiSheet(); render(); };
}
function promptTesi() {
  const T = S.tesi;
  return `Sto preparando la tesi di laurea triennale in Scienze Motorie (L-22).
Titolo provvisorio: ${T.titolo || 'da definire'}
Argomento: ${T.argomento || 'da definire'}
Tipo: ${T.tipo}
Relatore: ${T.relatore || 'da scegliere'}
Capitoli attuali: ${T.capitoli.length ? T.capitoli.map((c, i) => (i + 1) + '. ' + c.t + ' (' + CAP_STATI[c.st] + ')').join('; ') : 'nessuno'}
Miei appunti: ${T.note || '-'}

Aiutami in modo pratico e veloce: proponi un indice di 4-6 capitoli con 2-3 paragrafi ciascuno, le fonti scientifiche da cercare (parole chiave per PubMed/Google Scholar) e i prossimi 3 passi concreti. Scrivi in italiano.`;
}

/* ----- Impostazioni ----- */
function vAltro() {
  const e = S.imp.email, ponte = window.Ponte && Ponte.attivo() && Ponte.collegata('agendapp');
  return `<div class="hello"><h1>Impostazioni</h1></div>
  <div class="card"><h3>Studio</h3>
    <div class="field"><label>Come ti chiami</label><input class="inp" data-imp="nome" value="${esc(S.imp.nome)}" placeholder="Il tuo nome"></div>
    <div class="field"><label>Giorni di studio</label><div class="seg giorni" id="set-giorni">${[1, 2, 3, 4, 5, 6, 0].map(g => `<button type="button" data-act="giorno" data-v="${g}" class="${(S.imp.giorni || []).includes(g) ? 'on' : ''}">${['D', 'L', 'M', 'M', 'G', 'V', 'S'][g]}</button>`).join('')}</div>
      <p class="small muted" style="margin:6px 0 0">${(S.imp.giorni || []).length} giorn${(S.imp.giorni || []).length === 1 ? 'o' : 'i'} a settimana · ${(S.imp.giorni || []).length * (+S.imp.sedute || 1) * S.imp.minuti} minuti alla settimana. Nei giorni liberi la serie non si interrompe.</p></div>
    <div class="two"><div class="field"><label>Sedute al giorno</label><select class="inp" data-imp="sedute">${[1, 2, 3].map(n => `<option value="${n}" ${+S.imp.sedute === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="field"><label>Minuti per seduta</label><select class="inp" data-imp="minuti">${[15, 20, 25, 30, 45, 60].map(n => `<option ${+S.imp.minuti === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
    <div class="${+S.imp.sedute > 1 ? 'three' : 'two'}">${Array.from({ length: Math.max(1, +S.imp.sedute || 1) }, (_, i) => `<div class="field"><label>${+S.imp.sedute > 1 ? 'Ora seduta ' + (i + 1) : 'Ora della seduta'}</label><input class="inp" type="time" data-ora="${i}" value="${esc(orarioSeduta(i))}"></div>`).join('')}</div>
    <div class="two"><div class="field"><label>CFU del corso</label><input class="inp" type="number" data-imp="totCfu" value="${esc(S.imp.totCfu)}"></div>
    <div class="field"><label>Avvisi scadenze</label><select class="inp" data-imp="avvisoGiorni">${[1, 2, 3, 5, 7].map(n => `<option value="${n}" ${+S.imp.avvisoGiorni === n ? 'selected' : ''}>${n} giorn${n === 1 ? 'o' : 'i'} prima</option>`).join('')}</select></div></div>
  </div>
  <div class="card"><h3>Voce</h3>${voce.supporto() ? `
    <div class="field"><label>Voce di lettura</label><select class="inp" id="set-voce">${opzioniVoci()}</select></div>
    <div class="two"><div class="field"><label>Velocità</label><select class="inp" id="set-vel">${[0.8, 0.9, 1, 1.1, 1.2, 1.5, 1.8].map(v => `<option value="${v}" ${+S.imp.voceVel === v ? 'selected' : ''}>${v}×</option>`).join('')}</select></div>
    <div class="field"><label>&nbsp;</label><button class="btn block" data-act="voce-prova">${I('speaker')}Prova</button></div></div>
    <p class="small muted" style="margin:8px 0 0">Le voci sono quelle installate sul telefono. Per averne altre: Impostazioni di Android → Sintesi vocale (o "Text-to-speech") → installa i dati vocali italiani.</p>`
    : '<p class="sub">Questo browser non ha la lettura ad alta voce.</p>'}</div>
  <div class="card"><h3>Avvisi</h3>
    <div class="set"><div class="g">Notifiche sul telefono<small>Scadenze in arrivo e promemoria della seduta, quando l'app è aperta o in background</small></div><label class="sw"><input type="checkbox" data-act="notifiche" ${S.imp.notifiche ? 'checked' : ''}><span></span></label></div>
    <div class="set"><div class="g">Collegata ad AgendApp<small>${ponte ? 'Attiva: rette, appelli, esami e lezioni arrivano in agenda con gli avvisi a schermo intero' : 'Le scadenze arrivano in AgendApp e ti avvisa anche ad app chiusa'}</small></div><button class="btn sm ${ponte ? '' : 'pri'}" data-act="ponte">${ponte ? 'Gestisci' : 'Collega'}</button></div>
    <div class="set"><div class="g">Seduta di studio in AgendApp<small>Mette in agenda ${+S.imp.sedute > 1 ? 'le ' + S.imp.sedute + ' sedute' : 'la seduta'} di ogni giorno di studio, così AgendApp te le ricorda</small></div><label class="sw"><input type="checkbox" data-imp-b="studioInAgenda" ${S.imp.studioInAgenda ? 'checked' : ''}><span></span></label></div>
  </div>
  <div class="card"><h3>Email dell'università</h3><p class="sub">${e.url ? (e.ultimo ? 'Ultimo controllo ' + new Date(e.ultimo).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Script collegato') + ' · ' + e.mittenti.length + ' mittent' + (e.mittenti.length === 1 ? 'e' : 'i') : 'Non ancora collegata'}</p>
    <div class="btns"><button class="btn ${e.url ? '' : 'pri'}" data-act="email-setup">${I('mail')}${e.url ? 'Mittenti e collegamento' : 'Collega le email'}</button></div></div>
  <div class="card"><h3>Contenuti e backup</h3>
    <div class="btns"><button class="btn" data-act="importa">${I('upload')}Importa pacchetto</button><button class="btn" data-act="istruzioni">Istruzioni per Claude</button></div>
    <div class="btns"><button class="btn" data-act="backup">Esporta backup</button><button class="btn" data-act="ripristina">Ripristina backup</button></div>
    <p class="sub" style="margin-top:12px">Tutto resta su questo telefono. Fai un backup ogni tanto, soprattutto prima di cambiare telefono.</p></div>
  <p class="small muted" style="text-align:center">StudioFacile ${window.AppUpdate ? AppUpdate.current : ''} · <button class="btn ghost sm" data-act="aggiorna-controlla">Controlla aggiornamenti</button></p>`;
}

/* ---------------- fogli (bottom sheet) ---------------- */
function sheet(titolo, corpo, onClose) {
  chiudiSheet();
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-h"><h2>${titolo}</h2><button class="x" data-act="sheet-chiudi" aria-label="Chiudi">×</button></div>${corpo}</div>`;
  bg.addEventListener('click', e => { if (e.target === bg) chiudiSheet(); });
  bg._onClose = onClose;
  $('#sheets').appendChild(bg);
  return bg.querySelector('.sheet');
}
function chiudiSheet() { const b = $('#sheets .sheet-bg'); if (b) { if (b._onClose) b._onClose(); b.remove(); } }

function formMateria(m, comeSuperato) {
  const nuovo = !m; m = m || { nome: '', cfu: '', anno: '', stato: 'studio', voto: '', lode: false, valutazione: 'voto', dataSup: '', simN: 30, simMin: 30, colore: COLORI[S.materie.length % COLORI.length] };
  const es = m.id ? esameDi(m.id) : null;
  let stato = comeSuperato ? 'superato' : m.stato, val = m.valutazione || 'voto';
  const sh = sheet(nuovo ? 'Nuova materia' : comeSuperato ? 'Esame superato!' : 'Modifica materia', `
    <div class="field"><label>Nome della materia</label><input class="inp" id="m-nome" value="${esc(m.nome)}" placeholder="Es. Anatomia umana" autocomplete="off"></div>
    <div class="two"><div class="field"><label>CFU</label><input class="inp" id="m-cfu" type="number" min="0" value="${esc(m.cfu)}" placeholder="Es. 9"></div>
    <div class="field"><label>Anno di corso</label><select class="inp" id="m-anno"><option value="">—</option>${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${String(m.anno) === String(n) ? 'selected' : ''}>${n}° anno</option>`).join('')}</select></div></div>
    <div class="field"><label>Stato</label><div class="seg" id="m-stato">${Object.keys(STATI).map(v => `<button type="button" data-v="${v}" class="${stato === v ? 'on' : ''}">${STATI[v]}</button>`).join('')}</div></div>
    <div class="field"><label>Valutazione</label><div class="seg" id="m-val"><button type="button" data-v="voto" class="${val === 'voto' ? 'on' : ''}">Voto in trentesimi</button><button type="button" data-v="idoneita" class="${val === 'idoneita' ? 'on' : ''}">Idoneità</button></div></div>
    <div id="m-sup" ${stato === 'superato' ? '' : 'hidden'}>
      <div class="two"><div class="field" id="m-voto-f" ${val === 'voto' ? '' : 'hidden'}><label>Voto</label><input class="inp" id="m-voto" type="number" min="18" max="30" value="${esc(Math.min(30, +m.voto || 0) || '')}" placeholder="18-30"></div>
      <div class="field"><label>Data superamento</label><input class="inp" id="m-dsup" type="date" value="${esc(m.dataSup || (comeSuperato ? oggi() : ''))}"></div></div>
      <label class="set" id="m-lode-f" style="border:0;padding:8px 0 0" ${val === 'voto' ? '' : 'hidden'}><span class="g">Con lode</span><span class="sw"><input type="checkbox" id="m-lode" ${m.lode ? 'checked' : ''}><span></span></span></label>
    </div>
    <div id="m-studio" ${stato === 'superato' ? 'hidden' : ''}>
      <div class="field"><label>Data dell'esame</label><input class="inp" id="m-data" type="date" value="${es ? es.data : ''}"></div>
      <p class="small muted" style="margin:6px 0 0">Se non hai ancora prenotato lascia vuoto: il piano dura 4 settimane e la aggiungi quando prenoti.</p>
      <div class="two"><div class="field"><label>Crocette in simulazione</label><input class="inp" id="m-simn" type="number" min="5" value="${esc(m.simN || 30)}"></div>
      <div class="field"><label>Minuti simulazione</label><input class="inp" id="m-simmin" type="number" min="5" value="${esc(m.simMin || 30)}"></div></div>
    </div>
    <div class="btns"><button class="btn pri block" id="m-salva">Salva</button></div>
    ${nuovo ? '' : `<div class="btns"><button class="btn bad block" id="m-elimina">${I('trash')}Elimina materia e contenuti</button></div>`}`);
  const agg = () => {
    sh.querySelectorAll('#m-stato button').forEach(x => x.classList.toggle('on', x.dataset.v === stato));
    sh.querySelectorAll('#m-val button').forEach(x => x.classList.toggle('on', x.dataset.v === val));
    sh.querySelector('#m-sup').hidden = stato !== 'superato'; sh.querySelector('#m-studio').hidden = stato === 'superato';
    sh.querySelector('#m-voto-f').hidden = val !== 'voto'; sh.querySelector('#m-lode-f').hidden = val !== 'voto';
  };
  sh.querySelector('#m-stato').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { stato = b.dataset.v; agg(); } });
  sh.querySelector('#m-val').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { val = b.dataset.v; agg(); } });
  sh.querySelector('#m-salva').onclick = () => {
    const nome = sh.querySelector('#m-nome').value.trim();
    if (!nome) { toast('Scrivi il nome della materia'); return; }
    const voto = +sh.querySelector('#m-voto').value;
    if (stato === 'superato' && val === 'voto' && voto && (voto < 18 || voto > 30)) { toast('Il voto va da 18 a 30'); return; }
    const focusPrima = S.focus;
    if (nuovo) m = nuovaMateria(nome); else m.nome = nome;
    Object.assign(m, { cfu: sh.querySelector('#m-cfu').value, anno: sh.querySelector('#m-anno').value, stato, valutazione: val });
    if (stato === 'superato') {
      Object.assign(m, { voto: val === 'voto' ? (voto || '') : '', lode: val === 'voto' && voto === 30 && sh.querySelector('#m-lode').checked, dataSup: sh.querySelector('#m-dsup').value || oggi() });
      S.scad.filter(x => x.mid === m.id && x.tipo === 'esame' && !x.fatto).forEach(x => { x.fatto = true; x.fattoTs = Date.now(); });
      if (S.focus === m.id) { S.focus = ''; materiaAttiva(); }
    } else {
      m.voto = ''; m.lode = false; m.dataSup = '';
      m.simN = Math.max(5, +sh.querySelector('#m-simn').value || 30); m.simMin = Math.max(5, +sh.querySelector('#m-simmin').value || 30);
      impostaDataEsame(m, sh.querySelector('#m-data').value);
    }
    if (nuovo && stato !== 'studio') S.focus = focusPrima;
    if (stato === 'studio' && nuovo) S.focus = m.id;
    save(); chiudiSheet(); render();
    toast(comeSuperato || (stato === 'superato' && m.voto) ? '🎉 ' + nome + ': ' + votoTxt(m) + '. Un esame in meno!' : nuovo ? 'Materia aggiunta' : 'Salvato', 4000);
  };
  const el = sh.querySelector('#m-elimina');
  if (el) el.onclick = () => {
    if (!confirm('Elimino "' + m.nome + '" con lezioni, crocette e storico? Non si può annullare.')) return;
    const ids = new Set([...croDi(m.id), ...apeDi(m.id)].map(x => x.id));
    ids.forEach(id => delete S.srs[id]);
    S.lezioni = S.lezioni.filter(x => x.mid !== m.id); S.crocette = S.crocette.filter(x => x.mid !== m.id); S.aperte = S.aperte.filter(x => x.mid !== m.id);
    S.sim = S.sim.filter(x => x.mid !== m.id); S.scad = S.scad.filter(x => !(x.mid === m.id && x.tipo === 'esame'));
    S.materie = S.materie.filter(x => x.id !== m.id); ui.apertaMateria = '';
    save(); chiudiSheet(); render(); toast('Materia eliminata');
  };
}
function impostaDataEsame(m, data, ora) {
  let es = S.scad.find(s => s.mid === m.id && s.tipo === 'esame' && !s.fatto && s.data >= addD(oggi(), -1));
  if (!data) { if (es && es.fonte === 'materia') S.scad = S.scad.filter(s => s !== es); return; }
  if (!es) { es = { id: uid(), tipo: 'esame', mid: m.id, fonte: 'materia', titolo: '', data, ora: ora || '', note: '', fatto: false, fattoTs: 0 }; S.scad.push(es); }
  es.data = data; if (ora != null) es.ora = ora; es.titolo = 'Esame di ' + m.nome;
}
function formEsameData(m) {
  const es = esameDi(m.id);
  const sh = sheet('Data dell\'esame', `<p class="sub">${esc(m.nome)}: il piano si adatta ai giorni che mancano.</p>
    <div class="two"><div class="field"><label>Giorno</label><input class="inp" id="e-data" type="date" min="${oggi()}" value="${es ? es.data : ''}"></div><div class="field"><label>Ora</label><input class="inp" id="e-ora" type="time" value="${es ? es.ora : ''}"></div></div>
    <div class="btns"><button class="btn pri block" id="e-ok">Salva</button></div>`);
  sh.querySelector('#e-ok').onclick = () => { const d = sh.querySelector('#e-data').value; if (!d) { toast('Scegli il giorno'); return; } impostaDataEsame(m, d, sh.querySelector('#e-ora').value); save(); chiudiSheet(); render(); toast('Data salvata: ' + fData(d, true)); };
}
function formScadenza(s, preset) {
  const nuovo = !s;
  s = s || Object.assign({ tipo: 'retta', titolo: '', data: '', ora: '', note: '', mid: '', fatto: false }, preset || {});
  const sh = sheet(nuovo ? 'Nuova scadenza' : 'Scadenza', `
    <div class="field"><label>Tipo</label><div class="seg" id="s-tipo">${Object.keys(TIPI_S).map(k => `<button type="button" data-v="${k}" class="${s.tipo === k ? 'on' : ''}">${TIPI_S[k].label}</button>`).join('')}</div></div>
    <div class="field"><label>Descrizione</label><input class="inp" id="s-titolo" value="${esc(s.titolo)}" placeholder="Es. Seconda rata"></div>
    <div class="two"><div class="field"><label>Giorno</label><input class="inp" id="s-data" type="date" value="${esc(s.data)}"></div><div class="field"><label>Ora (facoltativa)</label><input class="inp" id="s-ora" type="time" value="${esc(s.ora)}"></div></div>
    ${preset && preset.altre && preset.altre.length ? `<p class="small muted" style="margin:6px 0 0">Altre date nell'email: ${preset.altre.map(d => `<button class="btn ghost sm" type="button" data-data="${d}">${fData(d)}</button>`).join('')}</p>` : ''}
    <div class="field"><label>Materia (facoltativa)</label><select class="inp" id="s-mid"><option value="">Nessuna</option>${S.materie.map(m => `<option value="${m.id}" ${s.mid === m.id ? 'selected' : ''}>${esc(m.nome)}</option>`).join('')}</select></div>
    <div class="field"><label>Note</label><textarea class="inp" id="s-note" style="min-height:70px" placeholder="Importo, link, cosa portare…">${esc(s.note)}</textarea></div>
    <div class="btns"><button class="btn pri block" id="s-salva">Salva</button></div>
    ${nuovo ? '' : `<div class="btns">${s.tipo !== 'esame' && s.tipo !== 'lezione' ? `<button class="btn" id="s-fatto">${s.fatto ? 'Segna da fare' : 'Segna fatta'}</button>` : ''}<button class="btn bad" id="s-elimina">${I('trash')}Elimina</button></div>`}`);
  let tipo = s.tipo;
  sh.querySelector('#s-tipo').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; tipo = b.dataset.v; sh.querySelectorAll('#s-tipo button').forEach(x => x.classList.toggle('on', x === b)); });
  sh.querySelectorAll('[data-data]').forEach(b => b.onclick = () => { sh.querySelector('#s-data').value = b.dataset.data; });
  sh.querySelector('#s-salva').onclick = () => {
    const data = sh.querySelector('#s-data').value, titolo = sh.querySelector('#s-titolo').value.trim();
    if (!data) { toast('Scegli il giorno'); return; }
    const v = { tipo, titolo: titolo || TIPI_S[tipo].label, data, ora: sh.querySelector('#s-ora').value, mid: sh.querySelector('#s-mid').value, note: sh.querySelector('#s-note').value };
    if (nuovo) { s = Object.assign({ id: uid(), fonte: preset && preset.emailId ? 'email' : 'manuale', emailId: (preset && preset.emailId) || '', fatto: false, fattoTs: 0 }, v); S.scad.push(s); }
    else Object.assign(s, v);
    if (preset && preset.emailId) { const p = S.posta.find(x => x.id === preset.emailId); if (p) p.stato = 'aggiunta'; }
    save(); chiudiSheet(); render(); toast(nuovo ? 'Scadenza aggiunta' : 'Salvata');
  };
  const f = sh.querySelector('#s-fatto'); if (f) f.onclick = () => { s.fatto = !s.fatto; s.fattoTs = Date.now(); save(); chiudiSheet(); render(); };
  const el = sh.querySelector('#s-elimina'); if (el) el.onclick = () => { if (!confirm('Elimino questa scadenza?')) return; S.scad = S.scad.filter(x => x !== s); save(); chiudiSheet(); render(); };
}
function formImporta(scheda) {
  scheda = scheda || 'pacchetto';
  const sh = sheet('Importa', `<div class="seg import-tab" id="i-tab">${[['pacchetto', 'Pacchetto Claude'], ['appunti', 'I miei appunti'], ['file', 'File e foto']].map(([v, l]) => `<button type="button" data-v="${v}" class="${scheda === v ? 'on' : ''}">${l}</button>`).join('')}</div><div id="i-corpo"></div>`);
  const corpo = sh.querySelector('#i-corpo');
  const mostra = t => {
    scheda = t; sh.querySelectorAll('#i-tab button').forEach(x => x.classList.toggle('on', x.dataset.v === t));
    if (t === 'pacchetto') {
      corpo.innerHTML = `<p class="sub">Copia tutta la risposta di Claude con il pacchetto (anche con il testo intorno) e incollala qui.</p>
        <div class="field"><textarea class="inp" id="i-testo" placeholder='{ "studiofacile": 1, "materia": "…", "lezioni": [ … ] }'></textarea></div>
        <div class="btns"><button class="btn" id="i-incolla">Incolla dagli appunti</button><button class="btn pri" id="i-ok">Importa</button></div>
        <p class="small muted" style="margin-top:12px">Se importi di nuovo la stessa lezione, la versione nuova sostituisce la vecchia e il ripasso già fatto resta.</p>`;
      const ta = corpo.querySelector('#i-testo');
      corpo.querySelector('#i-incolla').onclick = async () => { try { ta.value = await navigator.clipboard.readText(); } catch (e) { toast('Tieni premuto nel riquadro e scegli "Incolla"'); } };
      corpo.querySelector('#i-ok').onclick = () => importaTesto(ta.value);
    } else if (t === 'appunti') {
      chiudiSheet(); formAppunti(null, {});
    } else {
      corpo.innerHTML = `<p class="sub">Scegli uno o più file. Il testo diventa una lezione che puoi leggere, ascoltare e completare con le crocette di Claude.</p>
        <div class="tipi-file">
          <div>${I('file')}<b>PDF</b><span>slide e dispense</span></div><div>${I('file')}<b>Word</b><span>.docx</span></div>
          <div>${I('file')}<b>Testo</b><span>.txt, .md</span></div><div>${I('image')}<b>Foto</b><span>appunti, lavagna, libro</span></div>
          <div>${I('upload')}<b>Pacchetto</b><span>.json di Claude</span></div></div>
        <div class="btns"><button class="btn pri block" id="i-scegli">${I('upload')}Scegli i file</button></div>
        <div class="btns"><button class="btn block" id="i-foto">${I('image')}Scatta una foto</button></div>
        <p class="small muted" id="i-stato" style="margin-top:10px">I PDF fatti soprattutto di immagini vengono salvati anche pagina per pagina, così li sfogli nell'app. Per farli analizzare e trasformare in crocette caricali in Claude.</p>`;
      const scegli = cattura => {
        const i = document.createElement('input'); i.type = 'file'; i.multiple = !cattura;
        i.accept = cattura ? 'image/*' : '.pdf,.docx,.txt,.md,.markdown,.json,.csv,.rtf,image/*,application/pdf,text/plain';
        if (cattura) i.capture = 'environment';
        i.onchange = () => leggiFile([...i.files], corpo.querySelector('#i-stato'));
        i.click();
      };
      corpo.querySelector('#i-scegli').onclick = () => scegli(false);
      corpo.querySelector('#i-foto').onclick = () => scegli(true);
    }
  };
  sh.querySelector('#i-tab').addEventListener('click', e => { const b = e.target.closest('button'); if (b) mostra(b.dataset.v); });
  mostra(scheda);
}
function importaTesto(testo) {
  try {
    const r = importaPacchetti(estraiJson(testo));
    chiudiSheet();
    const mm = S.materie.find(x => x.nome === [...r.materie][0]);
    if (mm) { ui.tab = 'libretto'; ui.apertaMateria = mm.id; }
    render();
    toast(`✓ ${r.lezioni} lezion${r.lezioni === 1 ? 'e' : 'i'}, ${r.crocette} crocette, ${r.aperte} aperte${r.scartate ? ' · ' + r.scartate + ' scartate perché incomplete' : ''}`, 5000);
    return true;
  } catch (e) { toast('Non riesco a leggerlo: ' + e.message, 5000); return false; }
}
async function leggiFile(files, stato) {
  if (!files.length) return;
  const say = t => { if (stato) stato.textContent = t; };
  const testi = [], immagini = [];
  let titolo = '';
  try {
    for (const f of files) {
      const nome = f.name || 'file', ext = (nome.split('.').pop() || '').toLowerCase();
      if (!titolo) titolo = nome.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
      say('Leggo ' + nome + '…');
      if (ext === 'json') {
        const t = await f.text();
        try { const d = estraiJson(t); if (d && (d.materia || Array.isArray(d))) { if (importaTesto(t)) return; } } catch (e) { /* non è un pacchetto: lo tratto come testo */ }
        testi.push(t);
      } else if (ext === 'pdf' || f.type === 'application/pdf') {
        const { doc, pagine } = await testoDaPdf(f, (i, n) => say('PDF: pagina ' + i + ' di ' + n));
        const caratteri = pagine.join('').length;
        testi.push(pagine.map((t, i) => t ? '### Pagina ' + (i + 1) + '\n' + t : '').filter(Boolean).join('\n\n'));
        if (caratteri / Math.max(1, pagine.length) < 250) {
          say('Poche parole nel PDF: salvo le pagine come immagini…');
          (await paginePdfComeImmagini(doc, 60, (i, n) => say('Pagine come immagini: ' + i + ' di ' + n))).forEach(x => immagini.push(x));
        }
      } else if (ext === 'docx') {
        testi.push(await testoDaDocx(f));
      } else if (/^image\//.test(f.type) || /^(jpe?g|png|webp|heic|gif)$/.test(ext)) {
        immagini.push({ nome, dataUrl: await riduciImmagine(await leggiFileUrl(f), 1600) });
      } else if (ext === 'rtf') {
        testi.push((await f.text()).replace(/\\par[d]?/g, '\n').replace(/\{\*?\\[^{}]+}|[{}]|\\\S+ ?/g, '').trim());
      } else {
        testi.push(await f.text());
      }
    }
  } catch (e) { say('Errore: ' + e.message); toast('Non riesco a leggere il file: ' + e.message, 5000); return; }
  chiudiSheet();
  formAppunti(null, { titolo, testo: testi.filter(Boolean).join('\n\n'), immagini });
}

/* appunti: una lezione scritta da te (o da un file), modificabile */
function formAppunti(l, preset) {
  const nuovo = !l;
  const att = materiaAttiva();
  const v = l ? { mid: l.mid, titolo: l.titolo, testo: l.riassunto, n: l.n } : Object.assign({ mid: att ? att.id : (S.materie[0] || {}).id || '', titolo: '', testo: '' }, preset || {});
  const nuove = (preset && preset.immagini) || [], tolte = new Set();
  const vecchie = l ? (l.allegati || []) : [];
  const sh = sheet(nuovo ? 'I miei appunti' : 'Modifica lezione', `
    <div class="field"><label>Materia</label><select class="inp" id="a-mid">${S.materie.map(m => `<option value="${m.id}" ${v.mid === m.id ? 'selected' : ''}>${esc(m.nome)}</option>`).join('')}<option value="__nuova" ${S.materie.length ? '' : 'selected'}>+ Nuova materia…</option></select></div>
    <div class="field" id="a-nm-f" ${S.materie.length ? 'hidden' : ''}><label>Nome della nuova materia</label><input class="inp" id="a-nm" placeholder="Es. Anatomia umana"></div>
    <div class="field"><label>Titolo della lezione</label><input class="inp" id="a-tit" value="${esc(v.titolo)}" placeholder="Es. Lezione 4 – Il sistema cardiovascolare"></div>
    <div class="field"><label>Testo</label><textarea class="inp" id="a-testo" style="min-height:220px;font-size:15px" placeholder="Scrivi o incolla i tuoi appunti. Puoi usare:&#10;## Titolo&#10;- elenco puntato&#10;**parola importante**">${esc(v.testo)}</textarea></div>
    <div class="field"><label>Immagini</label><div class="thumbs" id="a-img"></div>
      <div class="btns" style="margin-top:8px"><button class="btn sm" type="button" id="a-add">${I('image')}Aggiungi foto</button><button class="btn sm" type="button" id="a-file">${I('file')}Aggiungi testo da file</button></div></div>
    <div class="btns"><button class="btn pri block" id="a-ok">Salva la lezione</button></div>
    <div class="btns"><button class="btn block" id="a-claude">${I('copy')}Salva e copia per Claude (crocette dai miei appunti)</button></div>
    ${nuovo ? '' : `<div class="btns"><button class="btn bad block" id="a-del">${I('trash')}Elimina la lezione</button></div>`}`);
  const sel = sh.querySelector('#a-mid');
  sel.onchange = () => { sh.querySelector('#a-nm-f').hidden = sel.value !== '__nuova'; };
  const disegna = async () => {
    const box = sh.querySelector('#a-img');
    const tutte = vecchie.filter(x => !tolte.has(x.id)).map(x => ({ k: 'v:' + x.id, nome: x.nome, src: null, id: x.id })).concat(nuove.map((x, i) => ({ k: 'n:' + i, nome: x.nome, src: x.dataUrl })));
    box.innerHTML = tutte.length ? tutte.map(x => `<span class="thumb"><img data-k="${x.k}" alt="${esc(x.nome)}" ${x.src ? `src="${x.src}"` : ''}><button type="button" data-tog="${x.k}" aria-label="Togli">×</button></span>`).join('') : '<span class="small muted">Nessuna immagine</span>';
    for (const x of tutte) if (!x.src) { const d = await imgGet(x.id); const im = box.querySelector(`img[data-k="${x.k}"]`); if (im && d) im.src = d; }
  };
  sh.querySelector('#a-img').addEventListener('click', e => {
    const b = e.target.closest('[data-tog]'); if (!b) return;
    const [t, k] = b.dataset.tog.split(':');
    if (t === 'v') tolte.add(k); else nuove.splice(+k, 1);
    disegna();
  });
  sh.querySelector('#a-add').onclick = () => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = true;
    i.onchange = async () => { for (const f of i.files) { try { nuove.push({ nome: f.name, dataUrl: await riduciImmagine(await leggiFileUrl(f), 1600) }); } catch (e) { toast(e.message); } } disegna(); };
    i.click();
  };
  sh.querySelector('#a-file').onclick = () => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '.pdf,.docx,.txt,.md,application/pdf,text/plain';
    i.onchange = async () => {
      const f = i.files[0]; if (!f) return; const ta = sh.querySelector('#a-testo');
      try {
        const ext = f.name.split('.').pop().toLowerCase(); toast('Leggo ' + f.name + '…');
        const t = ext === 'pdf' ? (await testoDaPdf(f)).pagine.map((x, k) => x ? '### Pagina ' + (k + 1) + '\n' + x : '').filter(Boolean).join('\n\n') : ext === 'docx' ? await testoDaDocx(f) : await f.text();
        ta.value = (ta.value ? ta.value + '\n\n' : '') + t; toast('Testo aggiunto');
      } catch (e) { toast('Non riesco a leggerlo: ' + e.message); }
    };
    i.click();
  };
  disegna();
  const salva = async () => {
    let mid = sel.value;
    if (mid === '__nuova') {
      const nm = sh.querySelector('#a-nm').value.trim(); if (!nm) { toast('Scrivi il nome della materia'); return null; }
      const ex = S.materie.find(m => norm(m.nome) === norm(nm)); mid = (ex || nuovaMateria(nm)).id;
    }
    const titolo = sh.querySelector('#a-tit').value.trim(), testo = sh.querySelector('#a-testo').value;
    if (!titolo) { toast('Dai un titolo alla lezione'); return null; }
    if (!testo.trim() && !nuove.length && !vecchie.some(x => !tolte.has(x.id))) { toast('Scrivi qualcosa o aggiungi una foto'); return null; }
    let lez = l;
    if (!lez) { lez = { id: uid(), mid, n: lezDi(mid).length + 1, titolo, riassunto: testo, letta: false, aggiunta: Date.now(), fonte: 'mio', allegati: [] }; S.lezioni.push(lez); }
    else {
      if (lez.mid !== mid) { S.crocette.filter(c => c.lid === lez.id).forEach(c => { c.mid = mid; }); S.aperte.filter(a => a.lid === lez.id).forEach(a => { a.mid = mid; }); }
      Object.assign(lez, { mid, titolo, riassunto: testo });
    }
    lez.allegati = (lez.allegati || []).filter(x => !tolte.has(x.id));
    tolte.forEach(imgDel);
    for (const x of nuove) { const id = uid(); if (await imgPut(id, x.dataUrl)) lez.allegati.push({ id, nome: x.nome }); }
    save();
    return lez;
  };
  sh.querySelector('#a-ok').onclick = async () => { const lez = await salva(); if (!lez) return; chiudiSheet(); ui.tab = 'libretto'; ui.apertaMateria = lez.mid; render(); toast('Lezione salvata'); };
  sh.querySelector('#a-claude').onclick = async () => {
    const lez = await salva(); if (!lez) return;
    const testo = promptAppunti(lez);
    chiudiSheet(); ui.tab = 'libretto'; ui.apertaMateria = lez.mid; render();
    navigator.clipboard.writeText(testo).then(() => toast('Salvata e copiata: incollala in Claude, poi importa il pacchetto che ti dà', 6000),
      () => sheet('Copia per Claude', `<pre class="code">${esc(testo)}</pre>`));
  };
  const d = sh.querySelector('#a-del');
  if (d) d.onclick = () => {
    if (!confirm('Elimino la lezione "' + l.titolo + '" con le sue crocette e domande?')) return;
    [...S.crocette, ...S.aperte].filter(x => x.lid === l.id).forEach(x => delete S.srs[x.id]);
    S.crocette = S.crocette.filter(x => x.lid !== l.id); S.aperte = S.aperte.filter(x => x.lid !== l.id);
    (l.allegati || []).forEach(x => imgDel(x.id));
    S.lezioni = S.lezioni.filter(x => x !== l); save(); chiudiSheet(); render(); toast('Lezione eliminata');
  };
}
function promptAppunti(l) {
  const m = mat(l.mid);
  return ISTRUZIONI_CLAUDE + `

---
Questa volta non ti carico slide: ecco i MIEI appunti della lezione. Preparami crocette e domande aperte basate su questi appunti${(l.allegati || []).length ? ' (ti allego anche le foto che ho nella lezione, se riesco)' : ''}.
Nel pacchetto usa esattamente: materia "${m ? m.nome : ''}", titolo "${l.titolo}", e lascia "riassunto": "" vuoto, così restano i miei appunti.

APPUNTI:
${l.riassunto}`;
}

function formEmail() {
  const e = S.imp.email;
  const sh = sheet('Email dell\'università', `<p class="sub">Uno script sul tuo Gmail legge <strong>solo</strong> le email dei mittenti qui sotto e le passa all'app. Nessun server esterno.</p>
    <div class="field"><label>Mittenti (uno per riga: indirizzo o dominio)</label><textarea class="inp" id="e-mitt" style="min-height:110px" placeholder="segreteria@unisanraffaele.gov.it&#10;unisanraffaele.gov.it">${esc(e.mittenti.join('\n'))}</textarea></div>
    <div class="field"><label>Indirizzo dello script (finisce con /exec)</label><input class="inp" id="e-url" value="${esc(e.url)}" placeholder="https://script.google.com/macros/s/…/exec"></div>
    <div class="two"><div class="field"><label>Codice segreto</label><input class="inp" id="e-cod" value="${esc(e.codice)}" placeholder="Lo stesso dello script"></div>
    <div class="field"><label>Guarda indietro</label><select class="inp" id="e-gg">${[14, 30, 60, 90].map(n => `<option value="${n}" ${+e.giorni === n ? 'selected' : ''}>${n} giorni</option>`).join('')}</select></div></div>
    <div class="btns"><button class="btn" id="e-prova">Prova collegamento</button><button class="btn pri" id="e-salva">Salva</button></div>
    <details style="margin-top:14px"><summary style="font-weight:800;cursor:pointer">Come si installa lo script (una volta sola)</summary><ol class="small" style="padding-left:20px">
      <li>Apri <strong>script.google.com</strong> con il tuo account Gmail → Nuovo progetto, chiamalo "StudioFacile".</li>
      <li>Cancella tutto e incolla il contenuto del file <strong>google/StudioFacile.gs</strong> del repository.</li>
      <li>In alto nel codice scrivi una tua parola segreta, poi Salva.</li>
      <li>Scegli la funzione <strong>prova</strong> e premi Esegui: accetta i permessi di Gmail.</li>
      <li>Esegui il deployment → Nuovo deployment → App web. Esegui come: Me. Chi può accedere: Chiunque.</li>
      <li>Copia l'indirizzo /exec e incollalo qui sopra con la stessa parola segreta.</li></ol></details>`);
  const leggi = () => ({ mittenti: sh.querySelector('#e-mitt').value.split(/[\n,;]+/).map(x => x.trim().toLowerCase()).filter(Boolean), url: sh.querySelector('#e-url').value.trim(), codice: sh.querySelector('#e-cod').value.trim(), giorni: +sh.querySelector('#e-gg').value });
  sh.querySelector('#e-prova').onclick = async () => {
    Object.assign(e, leggi());
    try { const j = await chiamaScript({ azione: 'prova', mittenti: e.mittenti }); toast('✓ Collegato a ' + (j.account || 'Gmail') + (j.trovate != null ? ' · ' + j.trovate + ' email trovate' : ''), 5000); }
    catch (er) { toast('Non collegato: ' + er.message, 5000); }
  };
  sh.querySelector('#e-salva').onclick = () => { Object.assign(e, leggi()); e.ultimo = 0; save(); chiudiSheet(); render(); controllaEmail(true); };
}
function leggiMail(p) {
  sheet(esc(p.subject || 'Email'), `<p class="small muted">${esc(p.from)} · ${p.date ? new Date(p.date).toLocaleString('it-IT') : ''}</p>
    <div class="read" style="font-size:15px;white-space:pre-wrap">${esc(p.body)}</div>
    <div class="btns">${p.link ? `<a class="btn" href="${esc(p.link)}" target="_blank" rel="noopener">Apri in Gmail</a>` : ''}${p.stato === 'nuova' ? `<button class="btn pri" data-act="mail-aggiungi" data-id="${esc(p.id)}">Aggiungi scadenza</button>` : ''}</div>`);
}
function archivioPosta() {
  const l = S.posta.filter(p => p.stato !== 'nuova');
  sheet('Email gestite', l.map(p => `<div class="item"><span class="ic">${I(p.stato === 'aggiunta' ? 'check' : 'mail')}</span><span class="g"><b>${esc(p.subject)}</b><span>${p.stato === 'aggiunta' ? 'Aggiunta alle scadenze' : 'Ignorata'} · ${p.date ? fData(ds(new Date(p.date))) : ''}</span></span><button class="btn sm" data-act="mail-ripristina" data-id="${esc(p.id)}">Rivedi</button></div>`).join('') || '<p class="muted">Nessuna</p>');
}
function istruzioni() {
  const testo = ISTRUZIONI_CLAUDE;
  const sh = sheet('Istruzioni per Claude', `<p class="sub">Crea un progetto in Claude per ogni materia (es. "SF · Anatomia") e incolla questo testo nelle istruzioni del progetto. Poi carica 2-3 PDF di lezioni per chat.</p>
    <pre class="code">${esc(testo)}</pre><div class="btns"><button class="btn pri block" id="c-copia">Copia le istruzioni</button></div>`);
  sh.querySelector('#c-copia').onclick = () => navigator.clipboard.writeText(testo).then(() => toast('Copiate'), () => toast('Tieni premuto sul testo per copiarlo'));
}
const ISTRUZIONI_CLAUDE = `Sei il tutor di StudioFacile. Obiettivo: farmi passare l'esame, non prendere il massimo.
Formato esame: test a crocette (minimo 15 domande), poi scritto in presenza con 6-7 domande aperte.

Per ogni PDF di lezione che carico:
1. Analizza TUTTE le slide, immagini comprese (schemi, tabelle, grafici, foto anatomiche): descrivi cosa mostrano quando serve a capire o è materia d'esame.
2. Scrivi un riassunto essenziale, leggibile in 5 minuti. Usa "## " per i titoli, "- " per gli elenchi, **grassetto** per i concetti chiave, e "> " per spiegare cosa mostra un'immagine importante (es. "> Slide 12: lo schema mostra…").
3. Prepara 20-30 crocette con 4 opzioni: distrattori credibili, di lunghezza simile alla risposta giusta, posizione della giusta variata. Aggiungi una spiegazione di una riga.
4. Prepara 3-5 domande aperte probabili, con una scaletta di risposta in 4-5 punti.
5. Alla fine dammi il pacchetto in un unico blocco di codice json, esattamente in questo formato:

{
  "studiofacile": 1,
  "materia": "Nome della materia",
  "lezioni": [
    {
      "numero": 1,
      "titolo": "Titolo della lezione",
      "riassunto": "## Titolo\\n- punto\\n> Slide 7: l'immagine mostra…",
      "crocette": [
        { "domanda": "…", "opzioni": ["…", "…", "…", "…"], "giusta": 2, "spiegazione": "…" }
      ],
      "aperte": [
        { "domanda": "…", "scaletta": ["punto 1", "punto 2", "punto 3", "punto 4"] }
      ]
    }
  ]
}

"giusta" è la posizione della risposta corretta contando da 0 (0 = prima opzione). Usa sempre lo stesso nome della materia in tutte le chat. Massimo 2-3 lezioni per chat. Scrivi in italiano.`;

/* ---------------- lettore, quiz, aperte, simulazione (schermo intero) ---------------- */
const PL = { attivo: null };
function apriPlayer(html) { const p = $('#player'); p.hidden = false; p.innerHTML = html; p.scrollTop = 0; document.body.style.overflow = 'hidden'; }
function chiudiPlayer() {
  voce.stop();
  if (PL.attivo && PL.attivo.timer) clearInterval(PL.attivo.timer);
  PL.attivo = null; const p = $('#player'); p.hidden = true; p.innerHTML = ''; document.body.style.overflow = ''; render();
}
function testa(titolo, sotto, destra) {
  return `<div class="pl-h"><button class="x" data-act="pl-chiudi" aria-label="Chiudi">×</button><div class="g"><b>${titolo}</b><span>${sotto || ''}</span></div>${destra || ''}</div>`;
}
const minuti = t0 => Math.max(0, (Date.now() - t0) / 60000);

/* --- voce (sintesi vocale del telefono) --- */
const voce = {
  pezzi: [], i: 0, attiva: false, inPausa: false,
  supporto: () => 'speechSynthesis' in window,
  voceIt() {
    const v = speechSynthesis.getVoices();
    return (S.imp.voceNome && v.find(x => x.voiceURI === S.imp.voceNome || x.name === S.imp.voceNome)) ||
      v.find(x => /it[-_]IT/i.test(x.lang) && /google|natural|neural|premium/i.test(x.name)) || v.find(x => /^it/i.test(x.lang)) || null;
  },
  leggi(testo, onFine) {
    this.stop();
    this.pezzi = testo.replace(/\s+/g, ' ').match(/[^.!?;:]+[.!?;:]*/g) || [testo];
    this.i = 0; this.attiva = true; this.inPausa = false; this.onFine = onFine;
    this.prossimo();
  },
  prossimo() {
    if (!this.attiva) return;
    if (this.i >= this.pezzi.length) { this.attiva = false; if (this.onFine) this.onFine(); aggVoce(); return; }
    const u = new SpeechSynthesisUtterance(this.pezzi[this.i].trim());
    const v = this.voceIt(); u.lang = v ? v.lang : 'it-IT'; u.rate = S.imp.voceVel || 1; if (v) u.voice = v;
    u.onend = () => { this.i++; this.prossimo(); };
    u.onerror = () => { this.i++; this.prossimo(); };
    speechSynthesis.speak(u); aggVoce();
  },
  pausa() { if (!this.attiva) return; if (this.inPausa) { speechSynthesis.resume(); this.inPausa = false; } else { speechSynthesis.pause(); this.inPausa = true; } aggVoce(); },
  stop() { this.attiva = false; this.inPausa = false; if (this.supporto()) speechSynthesis.cancel(); }
};
function opzioniVoci() {
  const v = voce.supporto() ? speechSynthesis.getVoices() : [];
  if (!v.length) return '<option value="">Voce predefinita del telefono</option>';
  const scelta = voce.voceIt();
  const it = v.filter(x => /^it/i.test(x.lang)), altre = v.filter(x => !/^it/i.test(x.lang));
  const opt = x => `<option value="${esc(x.voiceURI)}" ${scelta && scelta.voiceURI === x.voiceURI ? 'selected' : ''}>${esc(x.name.replace(/^(Microsoft|Google)\s+/, ''))}${x.localService ? '' : ' (online)'}</option>`;
  return (it.length ? `<optgroup label="Italiano">${it.map(opt).join('')}</optgroup>` : '') + (altre.length ? `<optgroup label="Altre lingue">${altre.map(opt).join('')}</optgroup>` : '');
}
if (voce.supporto()) speechSynthesis.onvoiceschanged = () => { const s = $('#set-voce'); if (s) s.innerHTML = opzioniVoci(); };
function aggVoce() {
  const b = $('#voce-play'); if (!b) return;
  b.innerHTML = voce.attiva && !voce.inPausa ? I('pause') + 'Pausa' : I('play') + (voce.attiva ? 'Riprendi' : 'Ascolta');
  const s = $('#voce-stato'); if (s) s.textContent = voce.attiva ? 'Frase ' + Math.min(voce.i + 1, voce.pezzi.length) + ' di ' + voce.pezzi.length : 'Lettura ad alta voce';
}
function testoPulito(md) { return String(md).replace(/^#+\s*/gm, '').replace(/^>\s*/gm, 'Immagine: ').replace(/^\s*[-*]\s+/gm, '').replace(/\*\*|__|\*/g, '').replace(/\n+/g, '. ').replace(/\.\s*\./g, '.'); }
function md(t) {
  const righe = String(t || '').replace(/\r/g, '').split('\n'); let h = '', lista = null;
  const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>').replace(/==(.+?)==/g, '<span class="hl">$1</span>');
  const chiudi = () => { if (lista) { h += `</${lista}>`; lista = null; } };
  for (const r of righe) {
    const t2 = r.trim();
    if (!t2) { chiudi(); continue; }
    let m;
    if ((m = t2.match(/^(#{1,3})\s+(.*)/))) { chiudi(); h += m[1].length === 1 ? `<h2>${inl(m[2])}</h2>` : m[1].length === 2 ? `<h2>${inl(m[2])}</h2>` : `<h3>${inl(m[2])}</h3>`; }
    else if ((m = t2.match(/^>\s?(.*)/))) { chiudi(); h += `<blockquote>${inl(m[1])}</blockquote>`; }
    else if ((m = t2.match(/^[-*•]\s+(.*)/))) { if (lista !== 'ul') { chiudi(); h += '<ul>'; lista = 'ul'; } h += `<li>${inl(m[1])}</li>`; }
    else if ((m = t2.match(/^\d+[.)]\s+(.*)/))) { if (lista !== 'ol') { chiudi(); h += '<ol>'; lista = 'ol'; } h += `<li>${inl(m[1])}</li>`; }
    else { chiudi(); h += `<p>${inl(t2)}</p>`; }
  }
  chiudi(); return h;
}

function apriLettura(lid, stepId) {
  const l = S.lezioni.find(x => x.id === lid); if (!l) return;
  const m = mat(l.mid);
  PL.attivo = { tipo: 'lettura', lid, stepId, t0: Date.now() };
  const allegati = l.allegati || [];
  apriPlayer(testa(esc(l.titolo), esc(m ? m.nome : '') + (l.fonte === 'mio' ? ' · i tuoi appunti' : ''), `<button class="x" data-act="lez-modifica" data-id="${l.id}" aria-label="Modifica">${I('edit')}</button>`) + `<div class="pl-body"><div class="read">${md(l.riassunto) || (allegati.length ? '' : '<p class="muted">Questa lezione non ha un riassunto.</p>')}</div>
    ${allegati.length ? `<div class="sec-t"><h2>Immagini</h2><span class="muted small">${allegati.length}</span></div><div class="galleria">${allegati.map(x => `<button data-act="img-apri" data-id="${x.id}"><img data-img="${x.id}" alt="${esc(x.nome)}"></button>`).join('')}</div>` : ''}
    ${voce.supporto() && l.riassunto ? `<div class="voice"><button id="voce-play" data-act="voce">${I('play')}Ascolta</button><span class="g" id="voce-stato">Lettura ad alta voce</span><button data-act="voce-scegli" aria-label="Scegli voce">${I('speaker')}</button><button data-act="voce-vel">${S.imp.voceVel}×</button><button data-act="voce-stop" aria-label="Ferma">${I('stop')}</button></div>` : ''}
    <div class="btns"><button class="btn ${l.letta ? '' : 'pri'} block" data-act="letta">${I('check')}${l.letta ? 'Già letta · chiudi' : 'Fatto, l\'ho letta'}</button></div>
    ${S.crocette.some(c => c.lid === l.id) ? `<div class="btns"><button class="btn block" data-act="quiz-lez" data-id="${l.id}">${I('quiz')}Crocette di questa lezione</button></div>` : l.fonte === 'mio' ? `<div class="btns"><button class="btn block" data-act="appunti-claude" data-id="${l.id}">${I('copy')}Copia per Claude: crocette da questi appunti</button></div>` : ''}</div>`);
  caricaGalleria();
}

async function caricaGalleria() {
  for (const im of document.querySelectorAll('img[data-img]')) { if (!im.src) { const d = await imgGet(im.dataset.img); if (d) im.src = d; } }
}

/* --- crocette --- */
function scegliCrocette(mid, n, lid) {
  let pool = croDi(mid);
  if (lid) return mescola(S.crocette.filter(c => c.lid === lid)).slice(0, n || 50);
  const lette = new Set(lezDi(mid).filter(l => l.letta).map(l => l.id));
  const p = mat(mid) ? piano(mat(mid)) : null;
  const da = oggi();
  const scadute = pool.filter(c => vista(c.id) && srs(c.id).due <= da).sort((a, b) => srs(a.id).due.localeCompare(srs(b.id).due) || srs(a.id).b - srs(b.id).b);
  // nuove: prima delle lezioni lette; dalla fase "Crocette" in poi anche delle altre
  let nuove = pool.filter(c => !vista(c.id) && (lette.has(c.lid) || (p && p.fase >= 1) || !lette.size));
  nuove = mescola(nuove).sort((a, b) => (lette.has(b.lid) ? 1 : 0) - (lette.has(a.lid) ? 1 : 0));
  let scelte = scadute.slice(0, n);
  if (scelte.length < n) scelte = scelte.concat(nuove.slice(0, n - scelte.length));
  if (scelte.length < n) {
    const resto = pool.filter(c => !scelte.includes(c) && vista(c.id)).sort((a, b) => srs(a.id).b - srs(b.id).b || srs(a.id).due.localeCompare(srs(b.id).due));
    scelte = scelte.concat(resto.slice(0, n - scelte.length));
  }
  return mescola(scelte);
}
function avviaQuiz(mid, n, stepId, lid) {
  const lista = scegliCrocette(mid, n || 20, lid);
  if (!lista.length) { toast('Nessuna crocetta per ora'); return; }
  // ogni domanda: le opzioni vengono mescolate qui, a ogni ripasso → la giusta cambia posizione
  const domande = lista.map(c => ({ c, ord: mescola(c.o.map((_, i) => i)) }));
  PL.attivo = { tipo: 'quiz', mid, stepId, domande, i: 0, ok: 0, risposto: null, rimandate: new Set(), t0: Date.now(), tot: domande.length };
  mostraQuiz();
}
function mostraQuiz() {
  const A = PL.attivo, D = A.domande[A.i], m = mat(A.mid);
  if (!D) return fineQuiz();
  const lett = 'ABCDEF';
  const risp = A.risposto;
  apriPlayer(testa('Crocette', esc(m ? m.nome : ''), `<span class="timer">${A.i + 1}/${A.domande.length}</span>`) +
    `<div class="prog"><i style="width:${A.i / A.domande.length * 100}%"></i></div><div class="pl-body">
    <div class="q">${esc(D.c.d)}</div>
    ${D.ord.map((oi, pos) => {
      let cls = '';
      if (risp != null) { if (oi === D.c.g) cls = 'giusta'; else if (oi === risp) cls = 'errata'; }
      return `<button class="opt ${cls}" data-act="risposta" data-v="${oi}" ${risp != null ? 'disabled' : ''}><span class="l">${lett[pos]}</span><span>${esc(D.c.o[oi])}</span></button>`;
    }).join('')}
    ${risp != null ? `<div class="expl ${risp === D.c.g ? 'ok' : 'no'}"><b>${risp === D.c.g ? 'Giusto!' : 'Era: ' + esc(D.c.o[D.c.g])}</b>${esc(D.c.s || '')}</div>
    <button class="btn pri block" data-act="quiz-avanti">${A.i + 1 < A.domande.length ? 'Avanti' + I('next') : 'Vedi il risultato'}</button>` : ''}</div>`);
}
function rispondi(oi) {
  const A = PL.attivo, D = A.domande[A.i];
  if (A.risposto != null) return;
  A.risposto = oi;
  const giusto = oi === D.c.g;
  if (giusto) A.ok++;
  if (!A.rimandate.has(D.c.id)) voto(D.c.id, giusto);
  // la sbagliata torna una volta alla fine della seduta (con le risposte rimescolate)
  if (!giusto && !A.rimandate.has(D.c.id)) { A.rimandate.add(D.c.id); A.domande.push({ c: D.c, ord: mescola(D.c.o.map((_, i) => i)), bis: true }); }
  registra(A.mid, { croc: 1, ok: giusto ? 1 : 0 });
  save(); mostraQuiz();
}
function fineQuiz() {
  const A = PL.attivo, min = minuti(A.t0);
  registra(A.mid, { min });
  if (A.stepId) segnaFatto(A.stepId);
  save();
  const sbagliate = A.domande.filter(d => d.bis).length;
  apriPlayer(testa('Crocette', 'Finito') + `<div class="pl-body"><div class="voto ${A.tot - A.rimandate.size >= A.tot * 0.6 ? 'si' : 'no'}"><b>${A.tot - A.rimandate.size}/${A.tot}</b><span class="muted">giuste al primo colpo</span></div>
    <div class="card"><p style="margin:0">${sbagliate ? `${sbagliate} domand${sbagliate === 1 ? 'a sbagliata ti tornerà' : 'e sbagliate ti torneranno'} domani. Quelle giuste si allontanano: le rivedrai tra qualche giorno.` : 'Tutto giusto al primo colpo. Queste domande le rivedrai tra qualche giorno.'}</p><p class="sub">${Math.max(1, Math.round(min))} minuti</p></div>
    <div class="btns"><button class="btn pri block" data-act="pl-chiudi">Chiudi</button></div></div>`);
}

/* --- domande aperte --- */
function scegliAperte(mid, n) {
  const pool = apeDi(mid), da = oggi();
  const scad = pool.filter(a => vista(a.id) && srs(a.id).due <= da).sort((a, b) => srs(a.id).b - srs(b.id).b);
  const nuove = mescola(pool.filter(a => !vista(a.id)));
  let s = scad.concat(nuove).slice(0, n);
  if (s.length < n) s = s.concat(pool.filter(a => !s.includes(a)).sort((a, b) => srs(a.id).b - srs(b.id).b).slice(0, n - s.length));
  return s;
}
function avviaAperte(mid, n, stepId) {
  const lista = scegliAperte(mid, n || 3);
  if (!lista.length) { toast('Nessuna domanda aperta per ora'); return; }
  PL.attivo = { tipo: 'aperte', mid, stepId, lista, i: 0, mostra: false, t0: Date.now(), voti: [] };
  mostraAperta();
}
function mostraAperta() {
  const A = PL.attivo, a = A.lista[A.i], m = mat(A.mid);
  if (!a) return fineAperte();
  apriPlayer(testa('Domande aperte', esc(m ? m.nome : ''), `<span class="timer">${A.i + 1}/${A.lista.length}</span>`) + `<div class="prog"><i style="width:${A.i / A.lista.length * 100}%"></i></div><div class="pl-body">
    <div class="q">${esc(a.d)}</div>
    ${A.mostra ? `<p class="muted small" style="margin:0">La risposta modello, punto per punto. Quanti ne hai detti?</p><ol class="scaletta">${a.p.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
      <div class="rate"><button class="r1" data-act="aperta-voto" data-v="1">Non la sapevo</button><button class="r2" data-act="aperta-voto" data-v="2">In parte</button><button class="r3" data-act="aperta-voto" data-v="3">La sapevo</button></div>`
    : `<div class="card"><p style="margin:0">${I('mic')} Rispondi <strong>ad alta voce</strong>, come allo scritto: 4-5 frasi bastano. Poi guarda la scaletta.</p></div>
      ${voce.supporto() ? `<div class="btns"><button class="btn" data-act="aperta-ascolta">${I('speaker')}Leggimi la domanda</button></div>` : ''}
      <div class="btns"><button class="btn pri block" data-act="aperta-mostra">${I('eye')}Mostra la scaletta</button></div>`}</div>`);
}
function fineAperte() {
  const A = PL.attivo, min = minuti(A.t0);
  registra(A.mid, { min, aperte: A.voti.length });
  if (A.stepId) segnaFatto(A.stepId);
  save();
  const sape = A.voti.filter(v => v === 3).length;
  apriPlayer(testa('Domande aperte', 'Finito') + `<div class="pl-body"><div class="voto si"><b>${sape}/${A.voti.length}</b><span class="muted">sapute bene</span></div>
    <div class="card"><p style="margin:0">Quelle che non sapevi tornano domani, quelle a metà tra due giorni.</p><p class="sub">${Math.max(1, Math.round(min))} minuti</p></div>
    <div class="btns"><button class="btn pri block" data-act="pl-chiudi">Chiudi</button></div></div>`);
}

/* --- simulazione d'esame --- */
function avviaSim(mid, stepId) {
  const m = mat(mid), pool = croDi(mid);
  if (pool.length < 5) { toast('Servono almeno 5 crocette'); return; }
  const n = Math.min(m.simN || 30, pool.length);
  const domande = mescola(pool).slice(0, n).map(c => ({ c, ord: mescola(c.o.map((_, i) => i)), r: null }));
  PL.attivo = { tipo: 'sim', mid, stepId, domande, i: 0, t0: Date.now(), fine: Date.now() + (m.simMin || 30) * 60000 };
  PL.attivo.timer = setInterval(tickSim, 1000);
  mostraSim();
}
function tickSim() {
  const A = PL.attivo; if (!A || A.tipo !== 'sim') return;
  const r = Math.max(0, A.fine - Date.now()), el = $('#sim-t');
  if (el) { el.textContent = Math.floor(r / 60000) + ':' + pad(Math.floor(r / 1000) % 60); el.classList.toggle('low', r < 120000); }
  if (r <= 0) { toast('Tempo scaduto'); fineSim(); }
}
function mostraSim() {
  const A = PL.attivo, D = A.domande[A.i], lett = 'ABCDEF';
  const fatte = A.domande.filter(d => d.r != null).length;
  apriPlayer(testa('Simulazione d\'esame', 'Domanda ' + (A.i + 1) + ' di ' + A.domande.length + ' · ' + fatte + ' risposte', '<span class="timer" id="sim-t"></span>') +
    `<div class="prog"><i style="width:${fatte / A.domande.length * 100}%"></i></div><div class="pl-body">
    <div class="q">${esc(D.c.d)}</div>
    ${D.ord.map((oi, pos) => `<button class="opt ${D.r === oi ? 'sel' : ''}" data-act="sim-r" data-v="${oi}"><span class="l">${lett[pos]}</span><span>${esc(D.c.o[oi])}</span></button>`).join('')}
    <div class="btns"><button class="btn" data-act="sim-nav" data-v="-1" ${A.i ? '' : 'disabled'}>${I('back')}Indietro</button>${A.i + 1 < A.domande.length ? `<button class="btn pri" data-act="sim-nav" data-v="1">Avanti${I('next')}</button>` : ''}</div>
    <div class="btns"><button class="btn ${fatte === A.domande.length ? 'acc' : ''} block" data-act="sim-consegna">Consegna${fatte < A.domande.length ? ' (' + (A.domande.length - fatte) + ' senza risposta)' : ''}</button></div></div>`);
  tickSim();
}
function fineSim() {
  const A = PL.attivo; if (!A) return;
  clearInterval(A.timer);
  const ok = A.domande.filter(d => d.r === d.c.g).length, tot = A.domande.length;
  const v = Math.round(ok / tot * 30), min = Math.round(minuti(A.t0));
  A.domande.forEach(d => { if (d.r !== d.c.g) voto(d.c.id, false); else if (!vista(d.c.id)) voto(d.c.id, true); });
  S.sim.push({ data: oggi(), mid: A.mid, ok, tot, voto: v, min });
  registra(A.mid, { min, sim: 1, croc: tot, ok });
  if (A.stepId) segnaFatto(A.stepId);
  save();
  const err = A.domande.filter(d => d.r !== d.c.g);
  PL.attivo = { tipo: 'sim-fine' };
  apriPlayer(testa('Simulazione', 'Risultato') + `<div class="pl-body"><div class="voto ${v >= 18 ? 'si' : 'no'}"><b>${v}/30</b><span class="muted">${ok} giuste su ${tot} · ${min} minuti</span></div>
    <div class="card"><p style="margin:0">${v >= 21 ? 'Ottimo: con questo punteggio il test lo passi con margine.' : v >= 18 ? 'Sufficiente, ma con poco margine: ripassa le sbagliate.' : 'Non ancora: le sbagliate ti tornano nei prossimi ripassi.'}</p></div>
    ${err.length ? `<div class="sec-t"><h2>Da rivedere (${err.length})</h2></div>` + err.map(d => `<div class="card"><b>${esc(d.c.d)}</b><p class="sub" style="color:var(--ok);font-weight:700">✓ ${esc(d.c.o[d.c.g])}</p>${d.r != null ? `<p class="sub" style="color:var(--bad)">✗ ${esc(d.c.o[d.r])}</p>` : '<p class="sub">Senza risposta</p>'}${d.c.s ? `<p class="sub">${esc(d.c.s)}</p>` : ''}</div>`).join('') : ''}
    <div class="btns"><button class="btn pri block" data-act="pl-chiudi">Chiudi</button></div></div>`);
}

/* ---------------- azioni ---------------- */
function passo(id) {
  const m = materiaAttiva(); if (!m) return;
  const x = passiDiOggi(m).passi.find(p => p.id === id); if (!x) return;
  if (x.tipo === 'import') return formImporta();
  if (x.tipo === 'lettura') return apriLettura(x.lid, x.id);
  if (x.tipo === 'crocette') return avviaQuiz(m.id, x.n, x.id);
  if (x.tipo === 'aperte') return avviaAperte(m.id, x.n, x.id);
  if (x.tipo === 'sim') return avviaSim(m.id, x.id);
}
function scaricaFile(nome, testo) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([testo], { type: 'application/json' })); a.download = nome;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
const AZ = {
  tab: el => { ui.tab = el.dataset.v; if (ui.tab !== 'libretto') ui.apertaMateria = ''; render(); window.scrollTo(0, 0); },
  passo: el => passo(el.dataset.v),
  materia: el => { ui.apertaMateria = el.dataset.id; render(); window.scrollTo(0, 0); },
  'materie-indietro': () => { ui.apertaMateria = ''; render(); },
  'materia-nuova': () => formMateria(null),
  'materia-modifica': el => formMateria(mat(el.dataset.id)),
  'esame-data': el => formEsameData(mat(el.dataset.id)),
  'cambia-focus': () => {
    const l = S.materie.filter(m => m.stato === 'studio');
    const sh = sheet('Su quale esame lavori?', l.map(m => `<button class="item" data-id="${m.id}"><span class="dotc" style="background:${m.colore}"></span><span class="g"><b>${esc(m.nome)}</b><span>${esameDi(m.id) ? 'esame ' + fData(esameDi(m.id).data) : 'senza data'}</span></span>${m.id === S.focus ? I('check') : ''}</button>`).join(''));
    sh.addEventListener('click', e => { const b = e.target.closest('.item'); if (!b) return; S.focus = b.dataset.id; save(); chiudiSheet(); render(); });
  },
  superato: el => formMateria(mat(el.dataset.id), true),
  filtro: el => { ui.filtro = el.dataset.v; render(); },
  'piano-incolla': () => formPiano(),
  inizia: el => { const m = mat(el.dataset.id); m.stato = 'studio'; m.inizio = oggi(); S.focus = m.id; save(); render(); toast('Ora stai preparando ' + m.nome); },
  importa: () => formImporta(),
  istruzioni: () => istruzioni(),
  esempio: async () => {
    try { const r = await fetch('pacchetto-esempio.json'); const res = importaPacchetti(await r.json()); const m = S.materie.find(x => res.materie.has(x.nome)); if (m) S.focus = m.id; save(); render(); toast('Esempio caricato: prova la seduta di oggi'); }
    catch (e) { toast('Esempio non disponibile offline'); }
  },
  leggi: el => apriLettura(el.dataset.id),
  'lez-modifica': el => { const l = S.lezioni.find(x => x.id === el.dataset.id); voce.stop(); chiudiPlayer(); formAppunti(l); },
  'img-apri': async el => { const d = await imgGet(el.dataset.id); if (d) sheet('Immagine', `<img src="${d}" alt="" style="width:100%;border-radius:12px">`); },
  'appunti-nuovi': () => formAppunti(null, {}),
  'appunti-claude': el => { const t = promptAppunti(S.lezioni.find(x => x.id === el.dataset.id)); navigator.clipboard.writeText(t).then(() => toast('Copiato: incollalo in Claude, poi importa il pacchetto', 5000), () => sheet('Copia per Claude', `<pre class="code">${esc(t)}</pre>`)); },
  quiz: el => avviaQuiz(el.dataset.id, 20),
  'quiz-lez': el => { const l = S.lezioni.find(x => x.id === el.dataset.id); voce.stop(); avviaQuiz(l.mid, 50, null, l.id); },
  aperte: el => avviaAperte(el.dataset.id, 5),
  sim: el => avviaSim(el.dataset.id),
  'pl-chiudi': () => {
    const A = PL.attivo;
    if (A && A.tipo === 'sim' && !confirm('Interrompo la simulazione? Non verrà salvata.')) return;
    if (A && A.tipo === 'quiz' && A.i > 0) { registra(A.mid, { min: minuti(A.t0) }); save(); }
    if (A && A.tipo === 'lettura') { registra(S.lezioni.find(l => l.id === A.lid).mid, { min: minuti(A.t0) }); save(); }
    chiudiPlayer();
  },
  letta: () => {
    const A = PL.attivo, l = S.lezioni.find(x => x.id === A.lid);
    if (!l.letta) { l.letta = true; registra(l.mid, { lette: 1 }); }
    l.ripasso = Date.now();
    registra(l.mid, { min: minuti(A.t0) });
    if (A.stepId) { segnaFatto(A.stepId); if (!S.oggi.lette) S.oggi.lette = []; if (!S.oggi.lette.includes(l.id)) S.oggi.lette.push(l.id); }
    save(); chiudiPlayer(); toast('Lezione letta ✓');
  },
  voce: () => {
    if (voce.attiva) return voce.pausa();
    const l = S.lezioni.find(x => x.id === PL.attivo.lid);
    voce.leggi(testoPulito(l.riassunto), () => toast('Lettura finita'));
  },
  'voce-stop': () => { voce.stop(); aggVoce(); },
  'voce-vel': el => { const v = [0.8, 1, 1.2, 1.5, 1.8]; S.imp.voceVel = v[(v.indexOf(S.imp.voceVel) + 1) % v.length] || 1; el.textContent = S.imp.voceVel + '×'; save(); if (voce.attiva) { const i = voce.i; voce.stop(); voce.attiva = true; voce.i = i; voce.prossimo(); } },
  risposta: el => rispondi(+el.dataset.v),
  'quiz-avanti': () => { PL.attivo.i++; PL.attivo.risposto = null; mostraQuiz(); },
  'aperta-mostra': () => { voce.stop(); PL.attivo.mostra = true; mostraAperta(); },
  'aperta-ascolta': () => voce.leggi(PL.attivo.lista[PL.attivo.i].d),
  'aperta-voto': el => {
    const A = PL.attivo, a = A.lista[A.i], v = +el.dataset.v, r = srs(a.id);
    r.v++; r.ultima = oggi();
    if (v === 3) { r.ok++; r.b = Math.min(r.b + 1, INTERVALLI.length - 1); } else if (v === 2) r.b = Math.max(1, Math.min(r.b, 2)); else r.b = 1;
    r.due = addD(oggi(), v === 1 ? 1 : v === 2 ? 2 : INTERVALLI[r.b]);
    A.voti.push(v); A.i++; A.mostra = false; save(); mostraAperta();
  },
  'sim-r': el => { const A = PL.attivo; A.domande[A.i].r = +el.dataset.v; if (A.i + 1 < A.domande.length) { A.i++; } mostraSim(); },
  'sim-nav': el => { const A = PL.attivo; A.i = Math.max(0, Math.min(A.domande.length - 1, A.i + +el.dataset.v)); mostraSim(); },
  'sim-consegna': () => { const A = PL.attivo, man = A.domande.filter(d => d.r == null).length; if (man && !confirm(man + ' domande senza risposta: consegno lo stesso?')) return; fineSim(); },
  'scad-nuova': () => formScadenza(null),
  'scad-apri': el => formScadenza(S.scad.find(s => s.id === el.dataset.id)),
  'scad-fatto': el => { const s = S.scad.find(x => x.id === el.dataset.id); s.fatto = !s.fatto; s.fattoTs = Date.now(); save(); render(); if (s.fatto) toast('Fatto ✓'); },
  'email-setup': () => formEmail(),
  'email-controlla': () => controllaEmail(true),
  'mail-aggiungi': el => { const p = S.posta.find(x => x.id === el.dataset.id); chiudiSheet(); const pr = p.prop || proponi(p); formScadenza(null, { tipo: pr.tipo === 'esito' ? 'altro' : pr.tipo, titolo: pr.titolo, data: pr.data, ora: pr.ora, mid: pr.mid, note: p.link ? 'Email: ' + p.link : '', emailId: p.id, altre: pr.altre }); },
  'mail-leggi': el => leggiMail(S.posta.find(x => x.id === el.dataset.id)),
  'mail-ignora': el => { const p = S.posta.find(x => x.id === el.dataset.id); p.stato = 'ignorata'; save(); render(); },
  'mail-ripristina': el => { const p = S.posta.find(x => x.id === el.dataset.id); p.stato = 'nuova'; save(); chiudiSheet(); render(); },
  'posta-archivio': () => archivioPosta(),
  'sheet-chiudi': () => chiudiSheet(),
  ponte: () => { if (window.Ponte) Ponte.apri(); },
  notifiche: async el => {
    if (el.checked) {
      if (!('Notification' in window)) { el.checked = false; toast('Questo browser non ha le notifiche'); return; }
      const p = await Notification.requestPermission();
      if (p !== 'granted') { el.checked = false; toast('Permesso negato: attivale dalle impostazioni del browser'); return; }
    }
    S.imp.notifiche = el.checked; save(); if (el.checked) toast('Notifiche attive');
  },
  backup: async () => {
    const img = {};
    for (const l of S.lezioni) for (const a of l.allegati || []) { const d = await imgGet(a.id); if (d) img[a.id] = d; }
    scaricaFile('studiofacile-backup-' + oggi() + '.json', JSON.stringify(Object.assign({}, S, { _img: img }))); toast('Backup salvato');
  },
  ripristina: () => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json';
    i.onchange = async () => {
      try { const d = JSON.parse(await i.files[0].text()); if (!d || d.v !== 1 || !Array.isArray(d.materie)) throw new Error();
        if (!confirm('Sostituisco tutti i dati di questo telefono con il backup?')) return;
        const img = d._img || {}; delete d._img;
        for (const id of Object.keys(img)) await imgPut(id, img[id]);
        S = Object.assign(statoVuoto(), d); S.imp = Object.assign(statoVuoto().imp, d.imp); save(); render(); toast('Backup ripristinato'); }
      catch (e) { toast('Questo file non è un backup di StudioFacile'); }
    };
    i.click();
  },
  'studia-comunque': () => { S.oggi.forza = true; save(); render(); },
  giorno: el => {
    const g = +el.dataset.v, l = new Set(S.imp.giorni || []);
    if (l.has(g)) { if (l.size === 1) { toast('Serve almeno un giorno di studio'); return; } l.delete(g); } else l.add(g);
    S.imp.giorni = [...l].sort(); save(); render();
  },
  'voce-prova': () => voce.leggi('Ciao, questa è la voce che userò per leggerti i riassunti. La velocità è ' + String(S.imp.voceVel).replace('.', ',') + '.'),
  'voce-scegli': () => {
    const sh = sheet('Voce di lettura', `<div class="field"><label>Voce</label><select class="inp" id="set-voce">${opzioniVoci()}</select></div>
      <div class="field"><label>Velocità</label><select class="inp" id="set-vel">${[0.8, 0.9, 1, 1.1, 1.2, 1.5, 1.8].map(v => `<option value="${v}" ${+S.imp.voceVel === v ? 'selected' : ''}>${v}×</option>`).join('')}</select></div>
      <div class="btns"><button class="btn pri block" data-act="sheet-chiudi">Fatto</button></div>`, () => { const b = $('[data-act=voce-vel]'); if (b) b.textContent = S.imp.voceVel + '×'; });
  },
  'tesi-inizia': () => { S.tesi = nuovaTesi(); save(); formTesi(); },
  'tesi-modifica': () => formTesi(),
  'cap-nuovo': () => formCapitolo(null),
  'cap-modifica': el => formCapitolo(S.tesi.capitoli.find(c => c.id === el.dataset.id)),
  'cap-stato': el => { const c = S.tesi.capitoli.find(x => x.id === el.dataset.id); c.st = (c.st + 1) % CAP_STATI.length; save(); render(); },
  'fase-tesi': el => { const f = S.tesi.fasi.find(x => x.id === el.dataset.id); f.f = !f.f; save(); render(); },
  'fase-tesi-del': el => { S.tesi.fasi = S.tesi.fasi.filter(x => x.id !== el.dataset.id); save(); render(); },
  'fase-tesi-add': () => { const i = $('#fase-nuova'); const t = i && i.value.trim(); if (!t) return; S.tesi.fasi.push({ id: uid(), t, f: false }); save(); render(); },
  'scad-tesi': () => formScadenza(null, { tipo: 'tesi', titolo: '' }),
  'tesi-claude': () => navigator.clipboard.writeText(promptTesi()).then(() => toast('Copiato: incollalo in una chat con Claude', 4000), () => sheet('Copia per Claude', `<pre class="code">${esc(promptTesi())}</pre>`)),
  'aggiorna-controlla': () => { if (window.AppUpdate) AppUpdate.check().then(n => { if (!n) toast('Hai già l\'ultima versione'); }); }
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT') return;
  const f = AZ[el.dataset.act];
  if (f) { e.preventDefault(); f(el, e); }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.act === 'notifiche') return AZ.notifiche(el);
  if (el.dataset.imp) { const k = el.dataset.imp; S.imp[k] = el.type === 'number' || k === 'minuti' || k === 'avvisoGiorni' ? +el.value : el.value; save(); renderTab(); }
  if (el.id === 'tesi-note' && S.tesi) { S.tesi.note = el.value; save(); return; }
  if (el.dataset.ora != null) {
    const i = +el.dataset.ora; S.imp.orari = [0, 1, 2].map(k => orarioSeduta(k)); S.imp.orari[i] = el.value || '20:30'; S.imp.orariMod = true;
    if (+S.imp.sedute === 1 || i === 0) S.imp.oraStudio = S.imp.orari[0]; save();
  }
  if (el.id === 'set-voce') { S.imp.voceNome = el.value; save(); voce.leggi('Ciao, questa è la voce che userò per leggerti i riassunti.'); }
  if (el.id === 'set-vel') { S.imp.voceVel = +el.value; save(); }
  if (el.dataset.imp === 'sedute' || el.dataset.imp === 'minuti') { S.imp[el.dataset.imp] = +el.value; save(); render(); return; }
  if (el.dataset.impB) { S.imp[el.dataset.impB] = el.checked; save(); if (el.checked && !(window.Ponte && Ponte.attivo())) toast('Ricordati di collegare AgendApp'); }
});

/* ---------------- Ponte: collaborazione con AgendApp ---------------- */
function pontePubblica() {
  const lim = addD(oggi(), -30), eventi = [];
  for (const s of S.scad) {
    if (s.data < lim) continue;
    const m = mat(s.mid), t = TIPI_S[s.tipo] || TIPI_S.altro;
    eventi.push({ id: s.id, tipo: t.agenda, titolo: s.titolo + (m && s.tipo !== 'esame' && !s.titolo.includes(m.nome) ? ' · ' + m.nome : ''), data: s.data, ora: s.ora || '', luogo: '', note: [t.label, s.note].filter(Boolean).join(' — '), area: 'studio', fatto: !!s.fatto, fattoTs: s.fattoTs || 0 });
  }
  const m = materiaAttiva();
  if (S.imp.studioInAgenda && m) {
    const N = Math.max(1, Math.min(3, +S.imp.sedute || 1)), sedOggi = passiDiOggi(m).sedute;
    for (let i = 0; i < 14; i++) {
      const d = addD(oggi(), i);
      if (!giornoStudio(d)) continue;
      for (let s = 0; s < N; s++) {
        const ora = orarioSeduta(s), [h, mi] = ora.split(':').map(Number);
        const fine = new Date(2000, 0, 1, h, mi + (S.imp.minuti || 30));
        const fatto = i === 0 && sedOggi[s] && sedOggi[s].passi.every(p => fattoOggi(p.id));
        eventi.push({ id: 'studio-' + d + (s ? '-' + (s + 1) : ''), tipo: 'appuntamento', titolo: 'StudioFacile · ' + S.imp.minuti + ' min di ' + m.nome + (N > 1 ? ' (' + (s + 1) + '/' + N + ')' : ''), data: d, ora, oraFine: pad(fine.getHours()) + ':' + pad(fine.getMinutes()), note: 'Apri StudioFacile: la seduta è già pronta.', area: 'studio', fatto: !!fatto });
      }
    }
  }
  return { eventi };
}
function ponteRicevi(da, dati) {
  // da AgendApp arriva lo stato "fatto" delle scadenze che le abbiamo mandato
  if (da !== 'agendapp' || !dati.fatti) return { n: 0 };
  let n = 0;
  Object.keys(dati.fatti).forEach(k => {
    if (k.indexOf('studiofacile:') !== 0) return;
    const s = S.scad.find(x => x.id === k.slice(13)), f = dati.fatti[k];
    if (!s || !f || (f.ts || 0) <= (s.fattoTs || 0) || !!f.f === !!s.fatto) return;
    s.fatto = !!f.f; s.fattoTs = f.ts; n++;
  });
  if (n) save();
  return { n, testo: n + ' scadenz' + (n === 1 ? 'a aggiornata' : 'e aggiornate') };
}
function avviaPonte() {
  if (!window.Ponte) return;
  Ponte.init({
    app: 'studiofacile', pubblica: pontePubblica, ricevi: ponteRicevi, scollega: () => 0, dopo: render, toast: m => toast(m),
    descr: {
      agendapp: 'Riceve rette, prenotazioni degli appelli, esami e lezioni di approfondimento con gli avvisi a schermo intero. Se le segni fatte lì, lo sa anche StudioFacile.',
      smistino: 'Per ora non scambia dati con StudioFacile.',
      cartellina: 'Per ora non scambia dati con StudioFacile.'
    }
  });
}

/* ---------------- avvio ---------------- */
async function avvia() {
  const d = await leggiStato();
  if (d && d.v === 1) { S = Object.assign(statoVuoto(), d); S.imp = Object.assign(statoVuoto().imp, d.imp || {}); S.imp.email = Object.assign(statoVuoto().imp.email, (d.imp || {}).email || {}); }
  if (S.oggi.data !== oggi()) S.oggi = { data: oggi(), fatti: {}, lette: [], forza: false };
  render();
  avviaPonte();
  setTimeout(controllaPromemoria, 1500);
  setInterval(controllaPromemoria, 60000);
  setTimeout(() => controllaEmail(false), 2500);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { salvaOra(); return; }
    if (S.oggi.data !== oggi()) { S.oggi = { data: oggi(), fatti: {}, lette: [], forza: false }; }
    if ($('#player').hidden) render();
    controllaPromemoria(); controllaEmail(false);
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
// per i test
window.StudioFacile = { get S() { return S; }, importaPacchetti, proponi, scegliCrocette, passiDiOggi, piano, estraiJson };
avvia();
})();

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

function statoVuoto() {
  return {
    v: 1,
    imp: { nome: '', minuti: 30, oraStudio: '20:30', studioInAgenda: false, totCfu: 180, avvisoGiorni: 3, voceVel: 1, notifiche: false,
      email: { url: '', codice: '', mittenti: [], giorni: 60, ultimo: 0 } },
    materie: [], focus: '', lezioni: [], crocette: [], aperte: [], srs: {}, sim: [], log: {},
    oggi: { data: '', fatti: {} }, scad: [], posta: [], notificati: {}
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
function passiDiOggi(m) {
  const p = piano(m), M = S.imp.minuti || 30, k = M / 30;
  const cro = croDi(m.id), ape = apeDi(m.id), passi = [];
  if (!p.lez.length && !cro.length) return { p, passi: [{ id: 'import', tipo: 'import', titolo: 'Importa il primo pacchetto', desc: 'Carica le slide in Claude e incolla qui il pacchetto' }] };
  const lettura = n => {
    // la lezione letta oggi resta nella seduta (segnata come fatta), non salta alla successiva
    const giaOggi = S.oggi.data === oggi() && Object.keys(S.oggi.fatti).map(k => k.indexOf('let-') === 0 && p.lez.find(x => 'let-' + x.id === k)).find(Boolean);
    const l = giaOggi || p.nonLette[0];
    if (l) passi.push({ id: 'let-' + l.id, tipo: 'lettura', lid: l.id, titolo: 'Leggi o ascolta: ' + l.titolo, desc: 'Riassunto · circa ' + Math.round(15 * k) + ' minuti' });
    return !!l;
  };
  const crocette = n => { n = Math.min(Math.round(n * k), scegliCrocette(m.id, Math.round(n * k)).length); if (cro.length && n > 0) passi.push({ id: 'cro', tipo: 'crocette', n, titolo: n + ' crocette', desc: 'Ripasso intelligente · circa ' + n + ' minuti' }); };
  const aperte = n => { n = Math.max(1, Math.round(n * k)); if (ape.length) passi.push({ id: 'ape', tipo: 'aperte', n, titolo: n + ' domand' + (n === 1 ? 'a aperta' : 'e aperte') + ' a voce', desc: 'Rispondi ad alta voce, poi confronta · circa ' + n * 4 + ' minuti' }); };
  const simula = () => { if (cro.length >= 10) passi.push({ id: 'sim', tipo: 'sim', titolo: 'Simulazione d\'esame', desc: Math.min(m.simN, cro.length) + ' crocette in ' + m.simMin + ' minuti, voto stimato' }); };
  const pari = diffD('2026-01-01', oggi()) % 2 === 0;
  if (p.fase === 0) { const ok = lettura(); crocette(ok ? 12 : 22); if (!ok) aperte(2); }
  else if (p.fase === 1) { const ok = lettura(); crocette(ok ? 14 : 22); if (!ok) aperte(2); }
  else if (p.fase === 2) { if (!lettura()) aperte(4); crocette(14); }
  else { if (pari || p.mancano <= 3) { simula(); aperte(1); } else { aperte(3); crocette(16); } if (!passi.length) crocette(25); }
  return { p, passi };
}
function fattoOggi(stepId) { return S.oggi.data === oggi() && !!S.oggi.fatti[stepId]; }
function segnaFatto(stepId) {
  if (S.oggi.data !== oggi()) S.oggi = { data: oggi(), fatti: {} };
  S.oggi.fatti[stepId] = true;
}
function registra(mid, campi) {
  const d = oggi(), l = S.log[d] || (S.log[d] = { min: 0, croc: 0, ok: 0, aperte: 0, lette: 0, sim: 0 });
  Object.keys(campi).forEach(k => { l[k] = (l[k] || 0) + campi[k]; });
  l.mid = mid;
}
function serie() {
  let n = 0, d = oggi();
  if (!attivo(d)) d = addD(d, -1);
  while (attivo(d)) { n++; d = addD(d, -1); }
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
  if (m && hm >= S.imp.oraStudio && !S.notificati['studio@' + oggi()]) {
    const { passi } = passiDiOggi(m);
    if (passi.some(p => !fattoOggi(p.id))) { S.notificati['studio@' + oggi()] = Date.now(); cambiato = true; notifica('È il momento dei tuoi ' + S.imp.minuti + ' minuti', m.nome + ': la seduta di oggi ti aspetta', 'studio'); }
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
const TABS = [['oggi', 'Oggi', 'home'], ['materie', 'Materie', 'book'], ['scadenze', 'Scadenze', 'cal'], ['altro', 'Impostazioni', 'gear']];
function renderTab() {
  const n = postaNuove() + scaduteNonFatte().length;
  $('#tabbar').innerHTML = TABS.map(([id, lbl, ic]) => `<button class="tab ${ui.tab === id ? 'on' : ''}" data-act="tab" data-v="${id}">${I(ic)}${lbl}${id === 'scadenze' && n ? `<span class="dot">${n}</span>` : ''}</button>`).join('');
  const d = new Date();
  $('#brand-sub').textContent = GIORNI[d.getDay()] + ' ' + d.getDate() + ' ' + MESI[d.getMonth()];
}
function render() {
  renderTab();
  const v = { oggi: vOggi, materie: ui.apertaMateria ? vMateria : vMaterie, scadenze: vScadenze, altro: vAltro }[ui.tab];
  $('#view').innerHTML = v();
}

/* ----- Oggi ----- */
function vOggi() {
  const m = materiaAttiva();
  const nome = S.imp.nome ? ', ' + esc(S.imp.nome) : '';
  const h = new Date().getHours();
  const saluto = (h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera') + nome;
  let html = `<div class="hello"><h1>${saluto}</h1><p>${S.imp.minuti} minuti oggi, e un esame alla volta.</p></div>`;
  html += bannerScadenze();
  if (!m) {
    if (!S.materie.length) return html + `<div class="card empty"><h3>Iniziamo dal primo esame</h3><p>Scegli l'esame più facile, non il più importante. Aggiungilo e importa il pacchetto che ti preparo da Claude.</p>
      <div class="btns"><button class="btn pri" data-act="materia-nuova">${I('plus')}Aggiungi esame</button><button class="btn" data-act="importa">${I('upload')}Importa pacchetto</button></div>
      <p class="small" style="margin-top:14px">Vuoi provare subito? <button class="btn ghost sm" data-act="esempio">Carica un esempio</button></p></div>` + vProgressi();
    return html + `<div class="card empty"><h3>Nessun esame in corso</h3><p>Hai superato tutto quello che avevi in lista. Aggiungi il prossimo esame.</p><div class="btns"><button class="btn pri" data-act="materia-nuova">${I('plus')}Prossimo esame</button></div></div>` + vProgressi();
  }
  const { p, passi } = passiDiOggi(m);
  const fatti = passi.filter(x => fattoOggi(x.id)).length;
  html += `<div class="card hero">
    <div class="row"><div class="g"><span class="chip">${p.senzaData ? 'Piano di 4 settimane' : 'Settimana ' + Math.min(p.settimana, Math.ceil(p.tot / 7)) + ' di ' + Math.ceil(p.tot / 7)}</span><h2 style="margin-top:8px">${esc(m.nome)}</h2>
    <p class="sub">${p.es ? 'Esame ' + fData(p.es.data, true) + (p.es.ora ? ' alle ' + p.es.ora : '') : 'Nessuna data d\'esame ancora'}</p></div></div>
    <div class="countdown"><div><b>${p.es ? p.mancano : '—'}</b><span>giorni all'esame</span></div><div><b>${p.lez.filter(l => l.letta).length}/${p.lez.length}</b><span>lezioni lette</span></div><div><b>${serie()}</b><span>giorni di fila</span></div></div>
    <div class="phases">${FASI.map((f, i) => `<i class="${i < p.fase ? 'done' : i === p.fase ? 'now' : ''}"></i>`).join('')}</div>
    <div class="phase-lbl"><span>Fase: ${FASI[p.fase]}</span><span>${FASI[Math.min(3, p.fase + 1)] !== FASI[p.fase] ? 'poi ' + FASI[p.fase + 1] : 'ultimo tratto'}</span></div>
    ${p.senzaData ? `<div class="btns"><button class="btn acc sm" data-act="esame-data" data-id="${m.id}">${I('cal')}Imposta la data dell'esame</button></div>` : ''}
  </div>`;
  html += `<div class="sec-t"><h2>La seduta di oggi</h2><span class="muted small">${fatti}/${passi.length} fatti</span></div>`;
  html += passi.map((x, i) => {
    const done = fattoOggi(x.id);
    return `<button class="step ${done ? 'done' : ''}" data-act="passo" data-v="${x.id}"><span class="n">${done ? I('check') : I({ lettura: 'read', crocette: 'quiz', aperte: 'mic', sim: 'timer', import: 'upload' }[x.tipo])}</span>
      <span class="g" style="flex:1;min-width:0"><b>${esc(x.titolo)}</b><span>${esc(x.desc)}</span></span>${done ? '' : I('next', 'go')}</button>`;
  }).join('');
  if (passi.length && fatti === passi.length) html += `<div class="allset">${I('check')}Seduta completata. Domani si riparte da qui: ${serie()} giorn${serie() === 1 ? 'o' : 'i'} di fila.</div>`;
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
  const sup = S.materie.filter(m => m.stato === 'superato');
  const cfu = sup.reduce((a, m) => a + (+m.cfu || 0), 0), tot = +S.imp.totCfu || 180;
  const media = sup.filter(m => +m.voto).length ? (sup.reduce((a, m) => a + (+m.voto || 0), 0) / sup.filter(m => +m.voto).length).toFixed(1) : '—';
  let minSett = 0; for (let i = 0; i < 7; i++) minSett += (S.log[addD(oggi(), -i)] || {}).min || 0;
  return `<div class="sec-t"><h2>I tuoi progressi</h2></div><div class="card"><div class="stats">
    <div class="stat"><b>${sup.length}</b><span>esami passati</span></div><div class="stat"><b>${cfu}</b><span>CFU su ${tot}</span></div><div class="stat"><b>${Math.round(minSett)}'</b><span>studio in 7 giorni</span></div></div>
    <div class="bar"><i style="width:${Math.min(100, cfu / tot * 100)}%"></i></div><p class="sub" style="margin-top:8px">${sup.length ? 'Media ' + media + ' · ' : ''}${Math.round(cfu / tot * 100)}% del percorso</p></div>`;
}

/* ----- Materie ----- */
function vMaterie() {
  const gruppi = [['studio', 'In preparazione'], ['pausa', 'Da fare più avanti'], ['superato', 'Superati']];
  let h = `<div class="hello"><h1>Materie</h1><p>Un esame alla volta: il primo superato riaccende la motivazione.</p></div>
    <div class="btns" style="margin-top:0"><button class="btn pri" data-act="materia-nuova">${I('plus')}Nuovo esame</button><button class="btn" data-act="importa">${I('upload')}Importa pacchetto</button></div>`;
  if (!S.materie.length) return h + `<div class="card empty"><h3>Ancora nessun esame</h3><p>Aggiungi un esame o importa direttamente un pacchetto: la materia si crea da sola.</p><button class="btn ghost" data-act="esempio">Carica un esempio per provare</button></div>`;
  for (const [st, lbl] of gruppi) {
    const ms = S.materie.filter(m => m.stato === st);
    if (!ms.length) continue;
    h += `<div class="sec-t"><h2>${lbl}</h2></div>` + ms.map(m => {
      const lez = lezDi(m.id), cro = croDi(m.id), es = esameDi(m.id), pr = st === 'studio' ? pronto(m.id) : null;
      return `<button class="subj" data-act="materia" data-id="${m.id}"><div class="top-l"><span class="dotc" style="background:${m.colore}"></span><h3>${esc(m.nome)}</h3>${m.id === S.focus && st === 'studio' ? '<span class="chip brand">attivo</span>' : ''}</div>
        <div class="meta">${m.cfu ? `<span class="chip">${m.cfu} CFU</span>` : ''}${st === 'superato' ? `<span class="chip ok">${m.voto ? m.voto + '/30' : 'superato'}</span>` : `<span class="chip">${lez.filter(l => l.letta).length}/${lez.length} lezioni</span><span class="chip">${cro.length} crocette</span>`}
        ${es ? `<span class="chip warn">esame ${fData(es.data)}</span>` : ''}${pr ? `<span class="chip ${pr.c === 'verde' ? 'ok' : pr.c === 'giallo' ? 'warn' : ''}">${pr.perc}% consolidato</span>` : ''}</div></button>`;
    }).join('');
  }
  return h;
}
function vMateria() {
  const m = mat(ui.apertaMateria);
  if (!m) { ui.apertaMateria = ''; return vMaterie(); }
  const lez = lezDi(m.id), cro = croDi(m.id), ape = apeDi(m.id), es = esameDi(m.id);
  const sims = S.sim.filter(s => s.mid === m.id).slice(-5).reverse();
  const daRip = cro.filter(c => vista(c.id) && srs(c.id).due <= oggi()).length;
  let h = `<button class="btn ghost" data-act="materie-indietro" style="margin-left:-10px">${I('back')}Materie</button>
    <div class="row"><span class="dotc" style="background:${m.colore};width:16px;height:16px"></span><h1 class="g" style="font-size:25px">${esc(m.nome)}</h1><button class="x" data-act="materia-modifica" data-id="${m.id}" aria-label="Modifica">${I('edit')}</button></div>
    <p class="muted" style="margin:4px 0 0">${m.cfu ? m.cfu + ' CFU · ' : ''}${m.stato === 'superato' ? 'Superato' + (m.voto ? ' con ' + m.voto + '/30' : '') : es ? 'Esame ' + fData(es.data, true) : 'Data d\'esame da inserire'}</p>`;
  if (m.stato === 'studio') h += `<div class="btns"><button class="btn pri" data-act="quiz" data-id="${m.id}" ${cro.length ? '' : 'disabled'}>${I('quiz')}Crocette${daRip ? ' (' + daRip + ')' : ''}</button><button class="btn" data-act="aperte" data-id="${m.id}" ${ape.length ? '' : 'disabled'}>${I('mic')}Aperte</button><button class="btn" data-act="sim" data-id="${m.id}" ${cro.length >= 5 ? '' : 'disabled'}>${I('timer')}Simulazione</button></div>`;
  h += `<div class="card"><div class="stats"><div class="stat"><b>${cro.length}</b><span>crocette</span></div><div class="stat"><b>${cro.filter(c => padroneggiata(c.id)).length}</b><span>consolidate</span></div><div class="stat"><b>${ape.length}</b><span>aperte</span></div></div></div>`;
  h += `<div class="sec-t"><h2>Lezioni</h2><button class="lnk" data-act="importa">+ Importa</button></div>`;
  h += lez.length ? `<div class="card" style="padding:4px 14px">${lez.map(l => `<button class="item" data-act="leggi" data-id="${l.id}"><span class="ic" style="${l.letta ? 'background:var(--ok-soft);color:var(--ok)' : ''}">${I(l.letta ? 'check' : 'read')}</span><span class="g"><b>${l.n ? l.n + '. ' : ''}${esc(l.titolo)}</b><span>${S.crocette.filter(c => c.lid === l.id).length} crocette · ${S.aperte.filter(a => a.lid === l.id).length} aperte${l.letta ? ' · letta' : ''}</span></span>${I('next')}</button>`).join('')}</div>`
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
  const spuntabile = s.tipo === 'retta' || s.tipo === 'appello' || s.tipo === 'altro';
  return `<div class="item ${s.fatto ? 'fatto' : ''}">${spuntabile ? `<button class="check ${s.fatto ? 'on' : ''}" data-act="scad-fatto" data-id="${s.id}" aria-label="Fatto">${s.fatto ? I('check') : ''}</button>` : `<span class="ic" style="width:28px;height:28px;border-radius:9px;color:${t.colore}">${I(t.icon)}</span>`}
    <button class="g" data-act="scad-apri" data-id="${s.id}" style="border:0;background:none;text-align:left;padding:0"><b>${esc(s.titolo)}</b><span>${esc(t.label)} · ${fData(s.data, true)}${s.ora ? ' · ' + s.ora : ''}${m ? ' · ' + esc(m.nome) : ''}${!s.fatto && s.data >= oggi() ? ' · ' + quandoTra(s.data) : ''}</span></button></div>`;
}
function vMail(p) {
  const pr = p.prop || {};
  return `<div class="mail"><div class="from">${esc(String(p.from || '').replace(/<.*>/, '').replace(/"/g, '') || p.from)} · ${p.date ? fData(ds(new Date(p.date))) : ''}</div><b>${esc(p.subject || '(senza oggetto)')}</b>
    <div class="prop">${pr.data ? `Ti propongo: <strong>${esc(TIPI_S[pr.tipo].label)}</strong> ${fData(pr.data, true)}${pr.ora ? ' alle ' + pr.ora : ''}` : `Tipo: <strong>${esc(TIPI_S[pr.tipo || 'altro'].label)}</strong> · nessuna data trovata`}</div>
    <div class="btns" style="margin-top:10px"><button class="btn sm pri" data-act="mail-aggiungi" data-id="${esc(p.id)}">${I('plus')}${pr.data ? 'Controlla e aggiungi' : 'Aggiungi a mano'}</button><button class="btn sm" data-act="mail-leggi" data-id="${esc(p.id)}">${I('eye')}Leggi</button><button class="btn sm" data-act="mail-ignora" data-id="${esc(p.id)}">Ignora</button></div></div>`;
}

/* ----- Impostazioni ----- */
function vAltro() {
  const e = S.imp.email, ponte = window.Ponte && Ponte.attivo() && Ponte.collegata('agendapp');
  return `<div class="hello"><h1>Impostazioni</h1></div>
  <div class="card"><h3>Studio</h3>
    <div class="field"><label>Come ti chiami</label><input class="inp" data-imp="nome" value="${esc(S.imp.nome)}" placeholder="Il tuo nome"></div>
    <div class="two"><div class="field"><label>Minuti al giorno</label><select class="inp" data-imp="minuti">${[15, 20, 30, 45, 60].map(n => `<option ${+S.imp.minuti === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="field"><label>Ora della seduta</label><input class="inp" type="time" data-imp="oraStudio" value="${esc(S.imp.oraStudio)}"></div></div>
    <div class="two"><div class="field"><label>CFU del corso</label><input class="inp" type="number" data-imp="totCfu" value="${esc(S.imp.totCfu)}"></div>
    <div class="field"><label>Avvisi scadenze</label><select class="inp" data-imp="avvisoGiorni">${[1, 2, 3, 5, 7].map(n => `<option value="${n}" ${+S.imp.avvisoGiorni === n ? 'selected' : ''}>${n} giorn${n === 1 ? 'o' : 'i'} prima</option>`).join('')}</select></div></div>
  </div>
  <div class="card"><h3>Avvisi</h3>
    <div class="set"><div class="g">Notifiche sul telefono<small>Scadenze in arrivo e promemoria della seduta, quando l'app è aperta o in background</small></div><label class="sw"><input type="checkbox" data-act="notifiche" ${S.imp.notifiche ? 'checked' : ''}><span></span></label></div>
    <div class="set"><div class="g">Collegata ad AgendApp<small>${ponte ? 'Attiva: rette, appelli, esami e lezioni arrivano in agenda con gli avvisi a schermo intero' : 'Le scadenze arrivano in AgendApp e ti avvisa anche ad app chiusa'}</small></div><button class="btn sm ${ponte ? '' : 'pri'}" data-act="ponte">${ponte ? 'Gestisci' : 'Collega'}</button></div>
    <div class="set"><div class="g">Seduta di studio in AgendApp<small>Mette in agenda i ${S.imp.minuti} minuti di ogni giorno alle ${esc(S.imp.oraStudio)}, così AgendApp te li ricorda</small></div><label class="sw"><input type="checkbox" data-imp-b="studioInAgenda" ${S.imp.studioInAgenda ? 'checked' : ''}><span></span></label></div>
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

function formMateria(m) {
  const nuovo = !m; m = m || { nome: '', cfu: '', stato: 'studio', voto: '', simN: 30, simMin: 30, colore: COLORI[S.materie.length % COLORI.length] };
  const es = m.id ? esameDi(m.id) : null;
  const sh = sheet(nuovo ? 'Nuovo esame' : 'Modifica esame', `
    <div class="field"><label>Nome della materia</label><input class="inp" id="m-nome" value="${esc(m.nome)}" placeholder="Es. Anatomia umana" autocomplete="off"></div>
    <div class="two"><div class="field"><label>CFU</label><input class="inp" id="m-cfu" type="number" value="${esc(m.cfu)}" placeholder="Es. 9"></div>
    <div class="field"><label>Data dell'esame</label><input class="inp" id="m-data" type="date" value="${es ? es.data : ''}"></div></div>
    <p class="small muted" style="margin:6px 0 0">Se non hai ancora prenotato lascia vuoto: il piano dura 4 settimane e la aggiungi quando prenoti.</p>
    <div class="field"><label>Stato</label><div class="seg" id="m-stato">${[['studio', 'In preparazione'], ['pausa', 'Più avanti'], ['superato', 'Superato']].map(([v, l]) => `<button type="button" data-v="${v}" class="${m.stato === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <div class="field" id="m-voto-f" ${m.stato === 'superato' ? '' : 'hidden'}><label>Voto</label><input class="inp" id="m-voto" type="number" min="18" max="31" value="${esc(m.voto)}" placeholder="Es. 24 (31 = 30 e lode)"></div>
    <div class="two"><div class="field"><label>Crocette nella simulazione</label><input class="inp" id="m-simn" type="number" min="5" value="${esc(m.simN)}"></div>
    <div class="field"><label>Minuti simulazione</label><input class="inp" id="m-simmin" type="number" min="5" value="${esc(m.simMin)}"></div></div>
    <div class="btns"><button class="btn pri block" id="m-salva">Salva</button></div>
    ${nuovo ? '' : `<div class="btns"><button class="btn bad block" id="m-elimina">${I('trash')}Elimina materia e contenuti</button></div>`}`);
  let stato = m.stato;
  sh.querySelector('#m-stato').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; stato = b.dataset.v; sh.querySelectorAll('#m-stato button').forEach(x => x.classList.toggle('on', x === b)); sh.querySelector('#m-voto-f').hidden = stato !== 'superato'; });
  sh.querySelector('#m-salva').onclick = () => {
    const nome = sh.querySelector('#m-nome').value.trim();
    if (!nome) { toast('Scrivi il nome della materia'); return; }
    if (nuovo) m = nuovaMateria(nome); else m.nome = nome;
    m.cfu = sh.querySelector('#m-cfu').value; m.stato = stato; m.voto = stato === 'superato' ? sh.querySelector('#m-voto').value : '';
    m.simN = Math.max(5, +sh.querySelector('#m-simn').value || 30); m.simMin = Math.max(5, +sh.querySelector('#m-simmin').value || 30);
    impostaDataEsame(m, sh.querySelector('#m-data').value);
    if (stato === 'studio' && nuovo) S.focus = m.id;
    save(); chiudiSheet(); render(); toast(nuovo ? 'Esame aggiunto' : 'Salvato');
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
function formImporta() {
  const sh = sheet('Importa pacchetto', `<p class="sub">Copia tutta la risposta di Claude con il pacchetto (anche con il testo intorno) e incollala qui, oppure scegli il file .json.</p>
    <div class="field"><textarea class="inp" id="i-testo" placeholder='{ "studiofacile": 1, "materia": "…", "lezioni": [ … ] }'></textarea></div>
    <div class="btns"><button class="btn" id="i-incolla">Incolla dagli appunti</button><button class="btn" id="i-file">${I('upload')}Scegli file</button></div>
    <div class="btns"><button class="btn pri block" id="i-ok">Importa</button></div>
    <p class="small muted" style="margin-top:12px">Se importi di nuovo la stessa lezione, la versione nuova sostituisce la vecchia e il ripasso già fatto resta.</p>`);
  const ta = sh.querySelector('#i-testo');
  sh.querySelector('#i-incolla').onclick = async () => { try { ta.value = await navigator.clipboard.readText(); } catch (e) { toast('Tieni premuto nel riquadro e scegli "Incolla"'); } };
  sh.querySelector('#i-file').onclick = () => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json,text/plain'; i.multiple = true;
    i.onchange = async () => { const t = await Promise.all([...i.files].map(f => f.text())); if (t.length === 1) ta.value = t[0]; else ta.value = '[' + t.map(x => JSON.stringify(estraiJson(x))).join(',') + ']'; };
    i.click();
  };
  sh.querySelector('#i-ok').onclick = () => {
    try {
      const r = importaPacchetti(estraiJson(ta.value));
      chiudiSheet();
      const m = [...r.materie][0];
      const mm = S.materie.find(x => x.nome === m);
      if (mm) { ui.tab = 'materie'; ui.apertaMateria = mm.id; }
      render();
      toast(`✓ ${r.lezioni} lezion${r.lezioni === 1 ? 'e' : 'i'}, ${r.crocette} crocette, ${r.aperte} aperte${r.scartate ? ' · ' + r.scartate + ' scartate perché incomplete' : ''}`, 5000);
    } catch (e) { toast('Non riesco a leggerlo: ' + e.message, 5000); }
  };
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
  voceIt() { const v = speechSynthesis.getVoices(); return v.find(x => /it[-_]IT/i.test(x.lang) && /google|natural|neural|premium/i.test(x.name)) || v.find(x => /^it/i.test(x.lang)) || null; },
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
    u.lang = 'it-IT'; u.rate = S.imp.voceVel || 1; const v = this.voceIt(); if (v) u.voice = v;
    u.onend = () => { this.i++; this.prossimo(); };
    u.onerror = () => { this.i++; this.prossimo(); };
    speechSynthesis.speak(u); aggVoce();
  },
  pausa() { if (!this.attiva) return; if (this.inPausa) { speechSynthesis.resume(); this.inPausa = false; } else { speechSynthesis.pause(); this.inPausa = true; } aggVoce(); },
  stop() { this.attiva = false; this.inPausa = false; if (this.supporto()) speechSynthesis.cancel(); }
};
if (voce.supporto()) speechSynthesis.onvoiceschanged = () => {};
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
  apriPlayer(testa(esc(l.titolo), esc(m ? m.nome : '')) + `<div class="pl-body"><div class="read">${md(l.riassunto) || '<p class="muted">Questa lezione non ha un riassunto.</p>'}</div>
    ${voce.supporto() && l.riassunto ? `<div class="voice"><button id="voce-play" data-act="voce">${I('play')}Ascolta</button><span class="g" id="voce-stato">Lettura ad alta voce</span><button data-act="voce-vel">${S.imp.voceVel}×</button><button data-act="voce-stop" aria-label="Ferma">${I('stop')}</button></div>` : ''}
    <div class="btns"><button class="btn ${l.letta ? '' : 'pri'} block" data-act="letta">${I('check')}${l.letta ? 'Già letta · chiudi' : 'Fatto, l\'ho letta'}</button></div>
    ${S.crocette.some(c => c.lid === l.id) ? `<div class="btns"><button class="btn block" data-act="quiz-lez" data-id="${l.id}">${I('quiz')}Crocette di questa lezione</button></div>` : ''}</div>`);
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
  tab: el => { ui.tab = el.dataset.v; if (ui.tab !== 'materie') ui.apertaMateria = ''; render(); window.scrollTo(0, 0); },
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
  superato: el => { const m = mat(el.dataset.id); formMateria(m); setTimeout(() => { const b = document.querySelector('#m-stato [data-v="superato"]'); if (b) b.click(); }, 50); },
  importa: () => formImporta(),
  istruzioni: () => istruzioni(),
  esempio: async () => {
    try { const r = await fetch('pacchetto-esempio.json'); const res = importaPacchetti(await r.json()); const m = S.materie.find(x => res.materie.has(x.nome)); if (m) S.focus = m.id; save(); render(); toast('Esempio caricato: prova la seduta di oggi'); }
    catch (e) { toast('Esempio non disponibile offline'); }
  },
  leggi: el => apriLettura(el.dataset.id),
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
    registra(l.mid, { min: minuti(A.t0) }); if (A.stepId) segnaFatto(A.stepId);
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
  backup: () => { scaricaFile('studiofacile-backup-' + oggi() + '.json', JSON.stringify(S)); toast('Backup salvato'); },
  ripristina: () => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json';
    i.onchange = async () => {
      try { const d = JSON.parse(await i.files[0].text()); if (!d || d.v !== 1 || !Array.isArray(d.materie)) throw new Error();
        if (!confirm('Sostituisco tutti i dati di questo telefono con il backup?')) return;
        S = Object.assign(statoVuoto(), d); S.imp = Object.assign(statoVuoto().imp, d.imp); save(); render(); toast('Backup ripristinato'); }
      catch (e) { toast('Questo file non è un backup di StudioFacile'); }
    };
    i.click();
  },
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
    for (let i = 0; i < 14; i++) {
      const d = addD(oggi(), i), [h, mi] = String(S.imp.oraStudio || '20:30').split(':').map(Number);
      const fine = new Date(2000, 0, 1, h, mi + (S.imp.minuti || 30));
      const fatto = i === 0 && (() => { const { passi } = passiDiOggi(m); return passi.length && passi.every(p => fattoOggi(p.id)); })();
      eventi.push({ id: 'studio-' + d, tipo: 'appuntamento', titolo: 'StudioFacile · ' + S.imp.minuti + ' min di ' + m.nome, data: d, ora: S.imp.oraStudio, oraFine: pad(fine.getHours()) + ':' + pad(fine.getMinutes()), note: 'Apri StudioFacile: la seduta di oggi è già pronta.', area: 'studio', fatto: !!fatto });
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
  if (S.oggi.data !== oggi()) S.oggi = { data: oggi(), fatti: {} };
  render();
  avviaPonte();
  setTimeout(controllaPromemoria, 1500);
  setInterval(controllaPromemoria, 60000);
  setTimeout(() => controllaEmail(false), 2500);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { salvaOra(); return; }
    if (S.oggi.data !== oggi()) { S.oggi = { data: oggi(), fatti: {} }; }
    if ($('#player').hidden) render();
    controllaPromemoria(); controllaEmail(false);
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
// per i test
window.StudioFacile = { get S() { return S; }, importaPacchetti, proponi, scegliCrocette, passiDiOggi, piano, estraiJson };
avvia();
})();

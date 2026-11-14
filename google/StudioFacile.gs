/* =========================================================
   STUDIOFACILE — script per Gmail (solo università) e Google Drive
   1) Legge sul TUO Gmail soltanto le email dei mittenti che scrivi
      nell'app (segreteria, docenti, piattaforma…) e le passa a StudioFacile.
   2) Collega PC e telefono: tiene una copia dei dati di StudioFacile nella
      cartella "StudioFacile" del TUO Google Drive (con le ultime 20 versioni),
      così ogni dispositivo collegato riceve le modifiche degli altri.
   Gira sul tuo account Google: nessun server esterno.

   ISTRUZIONI (una volta sola)
   1. Scrivi qui sotto una parola segreta (la stessa da mettere nell'app).
   2. Salva, scegli la funzione "prova" e premi Esegui (accetta i permessi).
   3. Esegui il deployment → Nuovo deployment → tipo "App web"
      Esegui come: Me · Chi può accedere: Chiunque → copia l'URL /exec.
   4. Nell'app: Impostazioni → Email dell'università e/o Collega PC e telefono
      → incolla URL e parola segreta (su ogni dispositivo).
   Dopo una modifica al codice: Gestisci deployment → matita → Nuova versione.
   ========================================================= */
const CODICE_SEGRETO = 'scrivi-qui-la-tua-parola-segreta';

const ETICHETTA = 'StudioFacile';
const MAX_EMAIL = 120;
const CARTELLA_DRIVE = 'StudioFacile';
const FILE_DATI = 'studiofacile-dati.json';
const MAX_VERSIONI = 20;

/** Da eseguire una volta dall'editor: chiede i permessi e controlla che tutto funzioni */
function prova() {
  etichetta_();
  Logger.log('Cartella su Drive: ' + cartella_().getUrl());
  Logger.log('Account: ' + Session.getActiveUser().getEmail());
  Logger.log(CODICE_SEGRETO === 'scrivi-qui-la-tua-parola-segreta'
    ? 'ATTENZIONE: cambia la parola segreta in cima al codice prima del deployment.'
    : 'Parola segreta impostata. Ora fai il deployment come App web.');
}

/** Aprendo l'URL nel browser vedi solo se lo script è attivo */
function doGet() {
  return json_({ ok: true, app: 'StudioFacile', messaggio: 'Script attivo. Collegalo dall\'app.' });
}

/** Chiamato dall'app: { token, azione: 'prova' | 'email', mittenti: [...], giorni } */
function doPost(e) {
  let p = {};
  try { p = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ error: 'richiesta non valida' }); }
  if (!p.token || p.token !== CODICE_SEGRETO) return json_({ error: 'token' });

  // ---- collegamento PC e telefono (Google Drive) ----
  if (/^(sinc|img)-/.test(String(p.azione || ''))) return sinc_(p);

  const mittenti = (p.mittenti || []).map(s => String(s).trim().toLowerCase()).filter(s => /^[a-z0-9@._+-]+$/.test(s)).slice(0, 40);
  if (!mittenti.length) return json_({ error: 'Nessun mittente indicato' });
  const giorni = Math.max(1, Math.min(180, parseInt(p.giorni || '60', 10)));
  const query = '(' + mittenti.map(m => 'from:' + m).join(' OR ') + ') newer_than:' + giorni + 'd -in:spam -in:trash';

  if (p.azione === 'prova') {
    const n = GmailApp.search(query, 0, 50).length;
    return json_({ ok: true, account: Session.getActiveUser().getEmail(), trovate: n });
  }

  if (p.azione === 'email') {
    const limite = Date.now() - giorni * 86400000;
    const out = [];
    const lab = etichetta_();
    GmailApp.search(query, 0, 60).forEach(t => {
      let tocca = false;
      t.getMessages().forEach(m => {
        if (out.length >= MAX_EMAIL || m.getDate().getTime() < limite) return;
        const da = String(m.getFrom()).toLowerCase();
        // nei thread misti tiene solo i messaggi dei mittenti scelti
        if (!mittenti.some(x => da.indexOf(x) !== -1)) return;
        out.push({
          id: m.getId(),
          from: m.getFrom(),
          subject: m.getSubject(),
          date: m.getDate().toISOString(),
          body: (m.getPlainBody() || '').replace(/\n{3,}/g, '\n\n').slice(0, 4000),
          link: 'https://mail.google.com/mail/u/0/#all/' + t.getId(),
          allegati: m.getAttachments({ includeInlineImages: false }).map(a => a.getName())
        });
        tocca = true;
      });
      if (tocca) t.addLabel(lab);
    });
    return json_({ ok: true, emails: out, ora: new Date().toISOString() });
  }
  return json_({ error: 'azione sconosciuta' });
}

/* ---------- dati di StudioFacile su Drive ---------- */
function sinc_(p) {
  const c = cartella_();
  if (p.azione === 'sinc-info') {
    const f = fileDati_(c);
    return json_(Object.assign({ ok: true }, f ? meta_(f) : { ver: 0 }));
  }
  if (p.azione === 'sinc-leggi') {
    const f = fileDati_(c);
    if (!f) return json_({ ok: true, ver: 0, stato: null });
    return json_(Object.assign({ ok: true, stato: JSON.parse(f.getBlob().getDataAsString('UTF-8')) }, meta_(f)));
  }
  if (p.azione === 'sinc-scrivi') {
    if (!p.stato || !Array.isArray(p.stato.materie)) return json_({ error: 'dati non validi' });
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const vecchio = fileDati_(c);
      if (vecchio) {
        const m = meta_(vecchio);
        // un altro dispositivo ha salvato dopo l'ultima volta che questo si è sincronizzato
        if (!p.forza && m.ver && m.ver !== p.base) return json_(Object.assign({ ok: false, conflitto: true }, m));
        // la versione precedente va in "versioni" (le ultime MAX_VERSIONI)
        const v = sotto_(c, 'versioni');
        vecchio.setName('studiofacile-' + Utilities.formatDate(new Date(m.ver || Date.now()), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss') + '_' + String(m.nome || 'dispositivo').replace(/[^\w-]+/g, '-') + '.json');
        vecchio.moveTo(v);
        const tutte = [];
        const it = v.getFiles();
        while (it.hasNext()) tutte.push(it.next());
        tutte.sort((a, b) => b.getDateCreated() - a.getDateCreated()).slice(MAX_VERSIONI).forEach(f => f.setTrashed(true));
      }
      const ver = Date.now();
      const f = c.createFile(Utilities.newBlob(JSON.stringify(p.stato), 'application/json', FILE_DATI));
      f.setDescription(JSON.stringify({ ver: ver, mod: p.mod || 0, dispositivo: String(p.dispositivo || ''), nome: String(p.nome || '').slice(0, 60) }));
      return json_({ ok: true, ver: ver });
    } finally { lock.releaseLock(); }
  }
  if (p.azione === 'img-lista') {
    const ids = [];
    const it = sotto_(c, 'immagini').getFiles();
    while (it.hasNext()) ids.push(it.next().getName().replace(/\.txt$/, ''));
    return json_({ ok: true, ids: ids });
  }
  if (p.azione === 'img-scrivi') {
    const id = String(p.id || '').replace(/[^\w-]/g, '');
    if (!id || !/^data:image\//.test(String(p.dato || ''))) return json_({ error: 'immagine non valida' });
    const im = sotto_(c, 'immagini');
    if (!im.getFilesByName(id + '.txt').hasNext()) im.createFile(Utilities.newBlob(String(p.dato), 'text/plain', id + '.txt'));
    return json_({ ok: true });
  }
  if (p.azione === 'img-leggi') {
    const im = sotto_(c, 'immagini'), out = {};
    (p.ids || []).slice(0, 10).forEach(x => {
      const id = String(x).replace(/[^\w-]/g, '');
      const it = im.getFilesByName(id + '.txt');
      if (it.hasNext()) out[id] = it.next().getBlob().getDataAsString('UTF-8');
    });
    return json_({ ok: true, immagini: out });
  }
  return json_({ error: 'azione sconosciuta' });
}
function cartella_() { const it = DriveApp.getFoldersByName(CARTELLA_DRIVE); return it.hasNext() ? it.next() : DriveApp.createFolder(CARTELLA_DRIVE); }
function sotto_(padre, nome) { const it = padre.getFoldersByName(nome); return it.hasNext() ? it.next() : padre.createFolder(nome); }
function fileDati_(c) { const it = c.getFilesByName(FILE_DATI); return it.hasNext() ? it.next() : null; }
function meta_(f) { try { return JSON.parse(f.getDescription() || '{}'); } catch (e) { return { ver: f.getLastUpdated().getTime() }; } }

function etichetta_() { return GmailApp.getUserLabelByName(ETICHETTA) || GmailApp.createLabel(ETICHETTA); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

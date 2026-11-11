/* =========================================================
   STUDIOFACILE — script per Gmail (solo università)
   Legge sul TUO Gmail soltanto le email dei mittenti che scrivi
   nell'app (segreteria, docenti, piattaforma…) e le passa a StudioFacile.
   Gira sul tuo account Google: nessun server esterno.

   ISTRUZIONI (una volta sola)
   1. Scrivi qui sotto una parola segreta (la stessa da mettere nell'app).
   2. Salva, scegli la funzione "prova" e premi Esegui (accetta i permessi).
   3. Esegui il deployment → Nuovo deployment → tipo "App web"
      Esegui come: Me · Chi può accedere: Chiunque → copia l'URL /exec.
   4. Nell'app: Impostazioni → Email dell'università → incolla URL e parola segreta.
   Dopo una modifica al codice: Gestisci deployment → matita → Nuova versione.
   ========================================================= */
const CODICE_SEGRETO = 'scrivi-qui-la-tua-parola-segreta';

const ETICHETTA = 'StudioFacile';
const MAX_EMAIL = 120;

/** Da eseguire una volta dall'editor: chiede i permessi e controlla che tutto funzioni */
function prova() {
  etichetta_();
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

function etichetta_() { return GmailApp.getUserLabelByName(ETICHETTA) || GmailApp.createLabel(ETICHETTA); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

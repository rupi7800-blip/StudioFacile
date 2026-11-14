# StudioFacile

Passa gli esami in tranquillità: **30 minuti al giorno**, un esame alla volta.

## Cosa fa
- **Oggi**: la seduta del giorno già pronta, divisa in passi (lettura, crocette, domande aperte, simulazione) secondo la fase del piano.
- **Piano in 4 fasi** fino alla data dell'esame: Riassunti → Crocette → Domande aperte → Simulazioni. Senza data dura 4 settimane.
- **Riassunti** con lettura ad alta voce (voce italiana del telefono, velocità regolabile).
- **Crocette a ripetizione spaziata**: le sbagliate tornano il giorno dopo, le giuste si allontanano. Le risposte vengono **mescolate a ogni ripasso**, quindi la giusta non è mai nella stessa posizione.
- **Domande aperte a voce**: rispondi ad alta voce, poi confronti con la scaletta e ti dai un voto.
- **Simulazione d'esame** con timer e voto stimato in trentesimi; il **semaforo** diventa verde quando sei pronto per prenotare.
- **Scadenze**: rette, prenotazione appelli, esami, lezioni di approfondimento. Vanno in **AgendApp** tramite il Ponte.
- **Email dell'università**: uno script sul tuo Gmail (`google/StudioFacile.gs`) legge solo i mittenti che scegli; l'app propone tipo e data, e tu confermi.
- **Libretto**: piano di studi (anche incollato dall'area studenti), CFU, anno, esami passati, voti, lodi, idoneità, media aritmetica e ponderata, base di laurea.
- **Tesi**: dati, capitoli con stato, lista delle cose da fare, scadenze (in AgendApp), appunti e aiuto da Claude.
- **Sedute**: da 1 a 3 al giorno, ognuna con il suo orario, e i giorni della settimana in cui studiare.
- **Voce**: scelta tra le voci installate sul telefono e velocità.
- **Importa**: pacchetti di Claude, appunti scritti da te, PDF, Word, testo e foto (i PDF fatti di immagini vengono salvati pagina per pagina). Le librerie per PDF (pdf.js) e Word (mammoth) sono in `js/lib`.
- Progressi: esami passati, CFU, media, minuti di studio.
- **Cartella sul dispositivo** (Impostazioni → Cartella sul dispositivo): scegli una cartella, l'app crea `StudioFacile/` e ci tiene `studiofacile-dati.json` aggiornato a ogni modifica, le immagini in `immagini/` e una copia al giorno in `backup/` (ultime 14). Su un dispositivo nuovo, o se il browser ha cancellato i dati, scegli la stessa cartella e i dati tornano. Disponibile dove il browser lo consente (Chrome/Edge su PC, Chrome su Android recenti); su iPhone si usa il backup o il collegamento PC–telefono.
- **PC e telefono collegati** (Impostazioni → PC e telefono collegati): lo script Google (`google/StudioFacile.gs`, lo stesso delle email) tiene i dati nella cartella `StudioFacile` del tuo Google Drive, con le ultime 20 versioni. Ogni dispositivo manda le sue modifiche e riceve quelle degli altri; se hai modificato su due dispositivi senza connessione l'app chiede quale versione tenere.
- **Copie automatiche**: una al giorno (ultimi 7 giorni) e una prima di ogni aggiornamento, sincronizzazione o ripristino.

## I contenuti
Un progetto Claude per materia (es. "SF · Anatomia") con le istruzioni che trovi nell'app (Impostazioni → Istruzioni per Claude). Claude analizza le slide, immagini comprese, e restituisce un **pacchetto** JSON da incollare in *Importa pacchetto*. Per provare: "Carica un esempio" (`pacchetto-esempio.json`).

## Pubblicazione
GitHub Pages dal branch `main`, cartella radice. Indirizzo: `https://rupi7800-blip.github.io/StudioFacile/`.
Deve stare sullo stesso indirizzo di AgendApp perché il Ponte funzioni.

## Aggiornamenti
Ad ogni modifica alzare la versione in `version.json` **e** in `index.html` (`data-version`): compare il tasto "Aggiorna".
L'aggiornamento svuota solo la cache dei file dell'app, mai i dati. Prima di ricaricare l'app salva tutto, fa una copia ("Prima dell'aggiornamento") e, se stavi facendo una lettura, crocette, domande aperte o una simulazione, la riprendi da dove eri. Durante una seduta il riquadro dell'aggiornamento non compare (resta solo il tasto).

Dopo aver aggiornato `google/StudioFacile.gs` su script.google.com: Esegui `prova` (per dare il permesso di Drive) e poi Gestisci deployment → matita → **Nuova versione**.

Tutti i dati restano sui tuoi dispositivi (IndexedDB, più la cartella scelta e il tuo Google Drive se li attivi). Backup ed esportazione da Impostazioni.

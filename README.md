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

## I contenuti
Un progetto Claude per materia (es. "SF · Anatomia") con le istruzioni che trovi nell'app (Impostazioni → Istruzioni per Claude). Claude analizza le slide, immagini comprese, e restituisce un **pacchetto** JSON da incollare in *Importa pacchetto*. Per provare: "Carica un esempio" (`pacchetto-esempio.json`).

## Pubblicazione
GitHub Pages dal branch `main`, cartella radice. Indirizzo: `https://rupi7800-blip.github.io/StudioFacile/`.
Deve stare sullo stesso indirizzo di AgendApp perché il Ponte funzioni.

## Aggiornamenti
Ad ogni modifica alzare la versione in `version.json` **e** in `index.html` (`data-version`): compare il tasto "Aggiorna".

Tutti i dati restano sul telefono (IndexedDB). Backup ed esportazione da Impostazioni.

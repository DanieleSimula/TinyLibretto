# TinyLibretto

## ⛔ Regole assolute (leggere prima di tutto)

- **MAI fare `git commit`, `git push`, aprire/modificare pull request, fare merge o rebase senza chiedere conferma esplicita a Daniele nella chat, ogni singola volta.** Un "sì" vale solo per l'azione chiesta, non per le successive.
- **MAI modificare questo `CLAUDE.md` senza chiedere conferma.** Proponi la modifica, mostra cosa cambierebbe, aspetta il sì.
- Rispondi sempre in italiano.

## Cos'è

PWA leggera per tenere il libretto universitario: registro esami, media ponderata, proiezione del voto di laurea, esami pianificati, statistiche, simulatore, import/export CSV, modalità demo. Niente account, niente server, niente tracciamento: tutto in `localStorage`.

- Repo: https://github.com/DanieleSimula/TinyLibretto
- Online (GitHub Pages da `main`): https://danielesimula.github.io/TinyLibretto/
- Licenza MIT. README bilingue (inglese + italiano).
- Uso principale: **iPhone, app installata sulla Home (standalone)**. Le correzioni vanno verificate pensando a iOS Safari/PWA.

## Stack e file

HTML/CSS/JS vanilla, nessun build, nessuna dipendenza (solo il font Archivo da Google Fonts per il design Beta).

| File | Ruolo |
|---|---|
| `index.html` | Markup di tutta l'app; nel `<head>` uno script applica il design scelto **prima** del disegno |
| `app.js` | Tutta la logica (~160 KB, file unico) |
| `style.css` | Design **Classico** (predefinito) |
| `segreteria.css` | Design **Beta** (ex "Segreteria") |
| `sw.js` | Service worker, cache offline |
| `manifest.json`, `icon*.png/svg`, `favicon.svg`, `apple-touch-icon.png` | PWA e icone |

### Server di test
`python server.py` (porta 8000, oppure `python server.py 8080`). Serve la cartella del progetto senza cache HTTP, apre il browser e stampa l'indirizzo per il telefono sulla stessa Wi-Fi. Ctrl+C per fermarlo.
- Il service worker resta in cache: se non vedi le modifiche, ricarica forzando (Ctrl+Shift+R) o aumenta la versione in `sw.js`.
- Dal telefono via IP di rete (HTTP) il service worker non parte: offline e barra "Nuova versione" si provano solo su localhost o GitHub Pages.

### Dati in `localStorage`
- `libretto_esami` — elenco esami
- `libretto_settings` — impostazioni (incluso `design`: `classico` / `segreteria`)
- `libretto_demo` — stato modalità demo

Non cambiare nomi o formato di queste chiavi senza migrazione: gli utenti hanno dati salvati.

## Convenzioni importanti

- **Service worker: a ogni modifica di un file in cache, incrementa `CACHE` in `sw.js`** (`tinylibretto-vN`, ora **v15**), altrimenti l'app installata non si aggiorna. Se aggiungi un file all'app, aggiungilo anche a `FILES`.
- Aggiornamenti: quando arriva un SW nuovo compare la barra "Nuova versione disponibile" (controllo a ogni ritorno in primo piano). Chi aveva la v1 viene ricaricato una volta sola.
- **Due design**: Classico è il predefinito; Beta si sceglie in Impostazioni > Design. Ogni modifica di UI va pensata per **entrambi** i CSS. Il classico contiene regole di compatibilità per il markup nato col Beta.
- **Numeri**: a schermo decimali con la virgola; l'export CSV resta col punto.
- **CSV**: colonne `Esame, Voto, CFU, Data`. Import da file, da testo incollato o tramite il prompt "Copia prompt per l'AI". All'import si sceglie "Aggiungi ai miei" (salta esami con lo stesso nome) o "Sostituisci tutto".
- **iPhone**:
  - altezza dell'app nella variabile `--app-h`; in standalone verticale usa `screen.height` (innerHeight su iOS PWA è corto di 62px → fascia nera sotto le schede)
  - niente zoom: `touch-action` sugli elementi, blocco del doppio tocco, campi a **16px** (sotto iOS zooma al focus)
  - niente testo selezionabile con pressione lunga (campi esclusi)
- Testi dell'interfaccia e commenti nel codice in italiano.
- Codice semplice e "lazy": deve funzionare, non essere lo stato dell'arte.

## Git

- Branch principale: `main` (pubblicato su GitHub Pages).
- Lavoro su branch dedicati (`design/…`, `fix/…`, `aggiornamento/…`) e merge in `main` via PR.
- Messaggi di commit **in italiano**, titolo descrittivo, corpo a punti che spiega il perché; terminano con la riga `Co-Authored-By` di Claude.
- Ricorda: commit, push e PR **solo dopo conferma** (vedi regole in cima).

## Storico

- **2026-05-05** — Primo rilascio: app con tema blu notte + oro, README.
- **2026-11-05** — Redesign "Segreteria" (bianco/nero, un solo accento arancio, font Archivo, niente ombre/angoli), barra "Nuova versione disponibile", SW con `cache: 'reload'`. Poi il redesign diventa **design beta selezionabile** e il classico resta predefinito (PR #1).
- **2026-11-05** — Fix fascia nera in fondo alla PWA su iPhone (`--app-h`, poi `screen.height` in standalone) (PR #2).
- **2026-11-07** — Import da AI (prompt + incolla CSV), scelta aggiungi/sostituisci all'import, "Segreteria" rinominato "Beta" con tab bar fluttuante a sole icone, niente zoom col doppio tocco. SW v11.
- **2026-11-17** — Classico: tab bar fluttuante "liquid glass" stile iOS 26 con bolla che segue il dito; niente selezione testo né zoom. SW v15.
- Branch in corso: `aggiornamento/import-ai-e-beta` (2 commit avanti a `main`, non ancora mergiato).

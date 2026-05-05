[🇮🇹 Versione Italiana](#tinylibretto---italiano)
# TinyLibretto 📚

Lightweight PWA to track university grades, simulate exams and project your final graduation score. No ads, no tracking.

> Developed for personal use, this app provides a simple way to track academic averages through a clean, distraction-free, and ad-free interface.

## Features

- **Grade tracking** — add exams with name, grade (18–30L, or ID for *idoneità*), CFU and date
- **Weighted average** — calculated in real time, with configurable *lode* value
- **Graduation projection** — projects your final score (base × 110/30 + thesis bonus + honours bonus)
- **Exam planner** — schedule future exams by session (month/year) and simulate outcomes
- **Statistics** — charts for grade distribution, average over time, trend analysis, best/worst exams, CFU summary and estimated completion date
- **Simulation** — adjust target grade and CFU interactively to see how they affect your average and graduation score
- **Import / Export CSV** — backup and restore your data
- **Demo mode** — try the app with sample data before adding your own
- **Offline-ready** — installable as a PWA, works without internet after first load
- **Dark / light / auto theme**
- **Customisable** — set your university name, degree programme, total CFU, expected years, thesis bonus, honours bonus and more

## Migrating from another app

If you're already using an app like **MyLibretto** and want to switch, you can export your grades as CSV from that app and import them directly into TinyLibretto. The importer accepts standard CSV files with columns: `Esame, Voto, CFU, Data`.

## Customisation (Settings)

| Setting | Default | Description |
|---|---|---|
| Total CFU | 180 | Adjust to your degree (e.g. 180 for 3-year, 120 for master's) |
| Expected years | 3 | Used for completion estimate |
| Thesis bonus | 4 | Points added to base graduation score |
| Honours bonus | 0 | Extra points for number of *lodi* |
| *Lode* value | 31 | Numeric value used in weighted average |
| Grade target | 105 | Used in projection tab |

## Install

Open the app in your browser and use the install prompt:

- **iOS** — Safari → Share → *Add to Home Screen*
- **Android** — Chrome → menu → *Add to Home Screen* / *Install app*
- **Desktop** — Chrome/Edge → install icon in the address bar

Or just use it directly in the browser at:
👉 **[danielesimula.github.io/TinyLibretto](https://danielesimula.github.io/TinyLibretto/)**

## Data & Privacy

All data is stored locally on your device via `localStorage`. Nothing is sent to any server. No accounts, no tracking, no ads.

## License

MIT © Daniele Simula

---

# TinyLibretto 📚 — Italiano

PWA leggera per tenere traccia dei voti universitari, simulare esami e proiettare il voto di laurea finale. Niente pubblicità, niente tracciamento.

> Sviluppata per necessità personale, quest'app nasce dall'esigenza di monitorare la media accademica e prevedere i voti degli esami attraverso un'interfaccia essenziale, priva di pubblicità o distrazioni.
## Funzionalità

- **Registro esami** — aggiungi esami con nome, voto (18–30L, o ID per idoneità), CFU e data
- **Media ponderata** — calcolata in tempo reale, con valore lode configurabile
- **Proiezione laurea** — calcola il voto finale (media × 110/30 + bonus tesi + bonus lodi)
- **Pianificazione esami** — programma esami futuri per sessione (mese/anno) e simula i risultati
- **Statistiche** — grafici su distribuzione voti, andamento della media, trend, migliore e peggiore esame, riepilogo CFU e stima completamento
- **Simulatore** — modifica voto obiettivo e CFU per vedere l'impatto sulla media e sul voto di laurea
- **Import / Export CSV** — backup e ripristino dei dati
- **Modalità demo** — prova l'app con dati di esempio prima di inserire i tuoi
- **Funziona offline** — installabile come PWA, funziona senza internet dopo il primo caricamento
- **Tema scuro / chiaro / automatico**
- **Personalizzabile** — imposta nome università, corso di laurea, CFU totali, anni previsti, bonus tesi, bonus lodi e altro

## Migrazione da un'altra app

Se stai già usando un'app come **MyLibretto** e vuoi passare a TinyLibretto, puoi esportare i tuoi voti in CSV da quell'app e importarli direttamente. L'importatore accetta file CSV standard con colonne: `Esame, Voto, CFU, Data`.

## Personalizzazione (Impostazioni)

| Impostazione | Default | Descrizione |
|---|---|---|
| CFU totali | 180 | Adatta al tuo corso (es. 180 per triennale, 120 per magistrale) |
| Anni previsti | 3 | Usato per la stima di completamento |
| Bonus tesi | 4 | Punti aggiunti alla base del voto di laurea |
| Bonus lodi | 0 | Punti extra in base al numero di lodi |
| Valore lode | 31 | Valore numerico usato nel calcolo della media |
| Voto obiettivo | 105 | Usato nella tab proiezione |

## Installazione

Apri l'app nel browser e usa il prompt di installazione:

- **iOS** — Safari → Condividi → *Aggiungi a schermata Home*
- **Android** — Chrome → menu → *Aggiungi a schermata Home* / *Installa app*
- **Desktop** — Chrome/Edge → icona di installazione nella barra degli indirizzi

Oppure usala direttamente nel browser:
👉 **[danielesimula.github.io/TinyLibretto](https://danielesimula.github.io/TinyLibretto/)**

## Dati e Privacy

Tutti i dati sono salvati localmente sul tuo dispositivo tramite `localStorage`. Nulla viene inviato a nessun server. Nessun account, nessun tracciamento, nessuna pubblicità.

## Licenza

MIT © Daniele Simula

# ProGuide

Eine Web-App, die Berufsschüler von der ersten Idee bis zur Abgabe durch eine
Projektarbeit begleitet – strukturiert nach der **IPERKA-Methode**
(Informieren, Planen, Entscheiden, Realisieren, Kontrollieren, Auswerten).
Fachunabhaengig, für Einzel- und Gruppenarbeiten.

Oberflaeche durchgehend auf Deutsch.

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS, Routing mit react-router
- **Backend / Auth / DB:** Supabase (Free Tier) – Postgres, Auth, Storage
- **KI:** Groq (primaer) mit Google Gemini als automatischem Fallback,
  über eine **Supabase Edge Function** – API-Keys liegen nie im Frontend
- **Export:** `docx` (Word) und `jsPDF` (PDF)

## Voraussetzungen

- Node.js 18+ und npm
- Ein kostenloses [Supabase](https://supabase.com)-Konto
- API-Keys von [Groq](https://console.groq.com) und
  [Google AI Studio (Gemini)](https://aistudio.google.com/app/apikey)
- Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) zum Deployen der Edge Function

## Schnellstart (lokal)

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen anlegen
cp .env.example .env
#    -> VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY eintragen

# 3. Dev-Server starten
npm run dev
```

> **Ohne Supabase-Konfiguration** startet die App im **Demo-Modus**: Die
> komplette Oberflaeche ist sichtbar (mit Beispieldaten), aber es werden keine
> echten Daten gespeichert. So kannst du das Grundgerüst sofort ansehen.

## Supabase einrichten

1. **Projekt anlegen** auf [supabase.com](https://supabase.com) (Region z.B. Frankfurt).
2. **Datenbank-Schema einspielen:** Im Supabase-Dashboard unter
   *SQL Editor* den Inhalt von [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   einfuegen und ausführen. Das legt alle Tabellen, Trigger, Row Level Security
   und den Storage-Bucket an. Beim Anlegen eines Projekts werden die 6
   IPERKA-Phasen automatisch erzeugt.
3. **Zugangsdaten** unter *Project Settings → API* kopieren:
   - `Project URL`  → `VITE_SUPABASE_URL`
   - `anon public`  → `VITE_SUPABASE_ANON_KEY`

   Diese beiden Werte sind öffentlich; die Absicherung erfolgt über RLS.

## KI / Edge Function einrichten

Die KI-Keys duerfen **nicht** ins Frontend. Sie werden als Supabase Function
Secrets gesetzt und nur in der Edge Function `ai` verwendet.

```bash
# Supabase CLI mit dem Projekt verknuepfen
supabase login
supabase link --project-ref DEIN-PROJEKT-REF

# Secrets setzen (Modelle optional überschreibbar)
supabase secrets set GROQ_API_KEY=...  GEMINI_API_KEY=...
supabase secrets set GROQ_MODEL=llama-3.3-70b-versatile  GEMINI_MODEL=gemini-1.5-flash

# Edge Function deployen
supabase functions deploy ai
```

Lokal testen lassen sich die Functions mit `supabase functions serve ai`.

Die App ruft die Funktion über `supabase.functions.invoke('ai', …)` auf.
Faellt Groq mit 429/5xx aus, wechselt die Funktion automatisch zu Gemini.

## Deployment

Die App ist statisch und kann auf **GitHub Pages** oder **Vercel** gehostet werden.

```bash
npm run build      # erzeugt dist/
```

- **Vercel:** Repository importieren, Framework „Vite“. Umgebungsvariablen
  `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` setzen. `VITE_BASE` = `/`.
- **GitHub Pages:** `VITE_BASE` auf `/<repo-name>/` setzen (z.B. `/projectguide/`)
  und `dist/` veröffentlichen. Da die App client-seitiges Routing nutzt, eine
  Kopie von `index.html` als `404.html` ablegen, damit Deeplinks funktionieren
  (wird beim Build automatisch erzeugt).

## Desktop-App (Windows) mit Auto-Update

Die App gibt es auch als installierbares Windows-Programm (Electron) – mit
Einklick-Installer und automatischen Updates (wie z.B. GitHub Desktop).

```bash
npm run electron:dev   # Desktop-App im Entwicklungsmodus starten
npm run dist           # Windows-Installer (.exe) nach release/ bauen
```

Der Installer landet unter `release/ProGuide Setup <version>.exe`. Beim ersten
Start installiert er sich pro Benutzer (ohne Admin-Rechte) und legt Verknuepfungen
an.

**Outlook-Integration:** In der Desktop-App oeffnet der Knopf „Zu Outlook
hinzufügen“ (Projekt- und Kalenderseite) die Termine direkt in Outlook. Im
Browser wird stattdessen eine `.ics`-Datei heruntergeladen, die sich per
Doppelklick in Outlook/Google/Apple Kalender importieren laesst.

**Automatische Updates einrichten:**

1. In `package.json` unter `build.publish` `owner`/`repo` auf dein GitHub-Repo
   setzen.
2. Code auf GitHub pushen.
3. Version in `package.json` erhoehen und veröffentlichen:
   ```bash
   set GH_TOKEN=dein-github-token   # PowerShell: $env:GH_TOKEN="..."
   npm run release
   ```
   Das baut den Installer und laedt ihn als GitHub-Release hoch.

Installierte Apps prüfen beim Start automatisch auf neue Releases, laden sie im
Hintergrund und aktivieren sie beim nächsten Neustart.

> Hinweis: Ein eigenes App-Icon kannst du als `build/icon.png` (mind. 512×512)
> ablegen – electron-builder erzeugt daraus automatisch das Windows-Icon.

## Projektstruktur

```
src/
  components/
    layout/      Sidebar, Topbar, AppLayout, Navigation
    ui/          Card, ProgressDonut, ProgressBar, StatusBadge, Avatar, …
    PhaseStepper.tsx, AIChatPanel.tsx
  context/       AuthContext (Supabase Auth)
  lib/           supabase, ai (askAI), iperka, schedule, utils, demo
  pages/         Dashboard, Projekte, Phasen-Ansicht, Auth, …
  types/         db.ts (Datenmodell-Typen)
supabase/
  migrations/    0001_init.sql (Schema + RLS)
  functions/ai/  Edge Function (Groq + Gemini)
```

## Sicherheit

- `.env` ist in `.gitignore` und wird **niemals** committet.
- Groq-/Gemini-Keys liegen ausschliesslich als Supabase Function Secrets.
- Row Level Security stellt sicher, dass nur Projektmitglieder die Daten ihres
  Projekts sehen und aendern koennen.

## Hinweis zur KI

Der KI-Assistent unterstützt beim Strukturieren und Beantworten von Fragen.
**KI kann Fehler machen – überpruefe wichtige Informationen.**

## Funktionsumfang

Alle Kernfunktionen sind umgesetzt:

- **Dashboard** mit Kennzahlen, Fortschritts- und Aufgaben-Donut, Deadline-Countdown
  mit Ampelsystem, Aktivitaetsverlauf, Schnellaktionen und Zeitplan-Warnung.
- **Projekt-Onboarding mit KI**: 6 Fragen, automatische Erzeugung der 6 IPERKA-Phasen
  mit Checklisten und Zeitplan-Vorschlag (Schweizer Feiertage/Wochenenden grob).
- **Schritt-für-Schritt-Führung** pro Phase: „Schritt X von 6", „Warum wichtig",
  Checkliste mit Persistenz, Phasenabschluss, Guide-Inhalte (Tipps, Fehler, Vorlagen,
  Lehrercheck) und KI-Assistent-Panel mit Schnellfragen.
- **Aufgaben** mit Zuweisung, Status und Filter. **Team** mit Beitritts-Code.
  **Kommentare** und **Aktivitaetsverlauf**.
- **Export** als Word (.docx) und PDF, plus Praesentations-Zusammenfassung und
  Protokoll-Vorlage (Export-Bibliotheken werden bei Bedarf nachgeladen).
- **Dateien** mit Upload (Supabase Storage), Liste und Download.
- **Vorlagen** als herunterladbare .docx-Dokumente, **Kalender** und **Zeitplan**
  aus echten Daten, **Einstellungen** mit Profil-Bearbeitung, globale **Suche**.
- Mobile-freundlich (Sidebar als Burger-Menue), Lade-/Fehler-/Leerzustaende überall.

Ohne verbundenes Backend läuft die App im **Demo-Modus** mit interaktiven
Beispieldaten (in localStorage). Mit Supabase + KI-Keys nutzt sie das echte
Backend und die Groq/Gemini-Edge-Function.

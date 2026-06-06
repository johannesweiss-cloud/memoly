# AGENTS.md — memoly

Werkzeug-neutrale Anleitung für KI-Agenten (Claude Code, Antigravity/Gemini, etc.),
die an diesem Repo arbeiten. Ziel: **eine** gemeinsame Wahrheit, keine doppelte Buchführung.

## Aufgaben-Tracking läuft über Linear

Alle Aufgaben, Bugs und Ideen werden in **Linear** geführt — **nicht** parallel in
Markdown-Listen im Repo.

- Projekt: **memoly** → https://linear.app/johannes-weiss/project/memoly-ebe9792ee848
- Team: **Johannes Weiß** (Key `JO`)
- Labels (minimal halten): `bug`, `feature`, `chore`
- Milestones: **M1 Launch-Readiness** · **M2 Go-Live: App freischalten** · **M3 Marketing & erste Nutzer**

**Regeln:**
- Vor dem Anlegen eines neuen Issues prüfen, ob es schon existiert (Linear durchsuchen) — keine Doppelungen.
- Ein Issue = eine Sache, in unter 1 Tag machbar. Größeres → Milestone oder Sub-Issues.
- Status-Fluss: `Backlog` / `Todo` → `In Progress` → `Done`.
- Beide Agenten greifen über den **Linear-MCP-Server** auf dasselbe Projekt zu. Zugriff
  einrichten, falls noch nicht vorhanden, statt eine eigene Liste zu starten.

## Arbeitsweise an einem Issue (für ALLE Agenten verbindlich)

Wenn du (Claude Code, Gemini, …) ein Issue übernimmst, fahre **exakt** diesen Loop:

1. **Übernehmen:** Agent-Label setzen (`claude` *oder* `gemini`, nie beide) und Status auf **In Progress**. So sieht der Mensch am Board live, wer woran arbeitet.
2. **Kontext ziehen:** Titel, Beschreibung *und vorhandene Kommentare* des Issues lesen, bevor du loslegst. Die Wahrheit steht im Issue, nicht im Chat.
3. **In sicheren Schritten arbeiten:** Immer zuerst die zerstörungsfreie/read-only-Prüfung, dann erst schreibende Schritte.
4. **STOPP vor irreversiblen oder nach außen wirkenden Aktionen** — Schreiben in die Prod-DB, Deployen, Löschen, externe Requests, Geld ausgeben. Erst den Menschen fragen, nicht blind ausführen.
5. **Dokumentieren per Linear-Kommentar:** Zwischenstand und Endergebnis als Kommentar ans Issue (was geprüft, welches Ergebnis, welcher Befund). Persistiert am Issue — beide Tools und der Mensch sehen es später.
6. **Manuelles Aufräumen explizit machen:** Was der Mensch noch von Hand tun muss (z. B. eine Test-Zeile im Dashboard löschen), klar in einen Kommentar schreiben.
7. **Done nur mit Beleg:** Status erst auf **Done**, wenn das Ergebnis tatsächlich nachgewiesen ist — nicht auf Vermutung.
8. **Scope kontrollieren:** Wächst die Aufgabe über ~1 Tag oder taucht Neues auf → neues Issue / Sub-Issue anlegen, statt das laufende aufzublähen.

**Parallelität:** Nie zwei Agenten gleichzeitig in denselben Dateien — sonst Merge-Konflikte. Disjunkte Issues verteilen oder je auf dem Branch des Issues arbeiten (Linear liefert pro Issue einen `gitBranchName`).

## Projekt-Kontext & Detail-Doku

- `CLAUDE.md` — ausführlicher Produkt-, Architektur- und Statuskontext (Quelle der Wahrheit für *wie* der Code funktioniert).
- `BUGS.md` — historische Bug-Liste, weitgehend abgearbeitet. Neue Bugs gehören nach Linear, nicht hier hin.
- `README.md` — Kurzbeschreibung des Produkts.

## Kurz: was memoly ist

Web-App, die ein gemeinsames Erlebnis (Date, Trip, Familienausflug) in ein kuratiertes
Erinnerungs-Booklet (Fotos + Titel + Beschreibung pro Moment) verwandelt, exportierbar als PDF.
Monetarisierung: 3,99 € einmalig pro Event via Lemon Squeezy. Stack: Vite + Supabase
(DB, Storage, RLS). Details siehe `CLAUDE.md`.

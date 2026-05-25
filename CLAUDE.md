# CLAUDE.md — Erinnerungen App (Arbeitstitel)

This file gives Claude context about this project: what it is, where it's going, and what decisions have already been made.

---

## What this product is

A web app that turns a shared experience (a date, trip, family outing) into a beautiful, curated memory book — with photos, titles, and descriptions per moment — that can be exported and actually looked at again, unlike photos that get lost in a phone gallery.

**Core emotional insight:** People take hundreds of photos but rarely revisit them. This product forces curation and adds context, making the memory worth keeping.

**Primary target audience:** Couples (highest emotional resonance), but also groups, families, and friend circles.

---

## Current state

The v0 single-file localforage + URL-hash app has been migrated to a Vite-bundled, Supabase-backed app. The localforage code, the `generateLink`/`#data=<base64>` sharing trick, and the original inline `<script>` block are all gone.

Supabase ist live angeschlossen (`vddmjeihfsmibtcwxaaa.supabase.co`): Schema-Migration läuft, `event-images`-Bucket existiert, alle drei Storage-RLS-Policies sind gesetzt (siehe `supabase/storage.md`). Lokaler End-to-End-Smoke-Test ist grün — Event anlegen, Moments mit Bildern, Extras, PDF-Export, Read-only-View im Inkognito-Browser. Noch **nicht** deployt; läuft nur auf `localhost:3001` (Port 3000 ist durch ein anderes lokales PWA-Projekt blockiert, `vite.config.js` setzt deshalb `strictPort: 3001`).

### Code layout

- `index.html` — markup + jspdf CDN script + `<script type="module" src="/src/main.js">`. No inline JS, no `onclick="..."` attributes.
- `src/main.js` — all frontend logic: routing, rendering, mutations, image upload, PDF export.
- `src/api.js` — Supabase wrapper. Exports `getEvent`, `createEvent`, `updateEvent`, `get/create/update/deleteMoment`, `get/create/deleteExtra`, `uploadImage`, `getPublicImageUrl`, plus the token API: `getEditToken(eventId)`, `setActiveEvent(eventId)`, `clearEditToken(eventId)`.
- `src/supabase.js` — client factory. `getClient()` returns the current Supabase client; `rebuildClient(token)` recreates it with (or without) an `X-Edit-Token` global header. Headers are set via `createClient({ global: { headers } })` because mutating `supabase.rest.headers` does **not** work in `@supabase/postgrest-js` ≥ 2.x (it's a DOM `Headers` object, and `from()` clones it).
- `supabase/migrations/001_initial_schema.sql` — `events` / `moments` / `extras` tables + RLS policies.
- `supabase/storage.md` — `event-images` bucket convention.

### Routing
- `#/` → Home; setup modal opens automatically (create-new-event mode).
- `#/event/<uuid>` → Event view. Edit mode if a local token for this id exists, read-only otherwise.
- `hashchange` triggers a full `location.reload()` — simpler than tearing down state.

### Token handling
- LocalStorage key `memoly_edit_tokens` is a **JSON map** `{ [eventId]: token }`. Multiple events per device.
- `setActiveEvent(eventId)` rebuilds the Supabase client with that event's token. **Must be called before write operations** (except `createEvent`, which activates the new event automatically).
- The token is only returned once by Supabase, at INSERT time. Frontend reads (`getEvent` etc.) explicitly never include `edit_token` in the select list.

### Image upload
- `resizeImageToBlob(file)` in `main.js`: Canvas resize (max 1800 px, JPEG 0.88) → Blob.
- Path convention: `event-images/<eventId>/moments/<momentId>.jpg` or `event-images/<eventId>/extras/<extraId>.jpg`.
- DB row stores only the path; the public URL is built on render via `supabase.storage.getPublicUrl()`.
- PDF export sets `img.crossOrigin = 'anonymous'` so Canvas doesn't taint when drawing Storage images.

### Architectural decisions worth knowing
- **Hash routing, not server-side routes.** Works with static hosting, no rewrites needed.
- **JSON map for tokens, not per-key entries.** Opens the door to a "My events" overview later without scanning all localStorage keys.
- **Client-side UUID for extras.** Atomic create-with-image flow: `crypto.randomUUID()` → upload to `extras/<uuid>.jpg` → insert row with that `id` and `image_path`. No half-state if upload fails.
- **Two-step flow for moments.** Insert without image first (primary "add date" UX has no photo step), then upload + `updateMoment(id, { image_path })` when the user picks a photo.
- **`setActiveEvent(eventId)` is explicit, never auto-detected.** Caller decides which event's token is active. Avoids accidental wrong-token writes when multiple events exist locally.
- **`uploadImage` lives in `api.js`.** `main.js` never touches `getClient().storage` directly — same boundary as for DB calls.

## To run locally

Auf diesem Rechner ist alles bereits eingerichtet — `.env.local` existiert, Bucket + Policies sind im verbundenen Supabase-Projekt drin. Für ein frisches Setup (z.B. zweiter Rechner, neuer Mitarbeiter):

1. `.env.local` im Project-Root anlegen:
   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```
   Ohne die wirft `src/supabase.js` einen klaren Fehler beim Modul-Load (Bug #11).
2. `supabase/migrations/001_initial_schema.sql` im Supabase SQL Editor ausführen.
3. Public Bucket `event-images` im Supabase Dashboard → Storage anlegen, **und die drei RLS-Policies aus `supabase/storage.md`** (INSERT, UPDATE, SELECT auf `storage.objects`). Die SELECT-Policy ist nicht-offensichtlich Pflicht — ohne sie schlägt `.upload()` mit irreführendem RLS-Fehler fehl.
4. `npm install && npm run dev` → App läuft auf `http://localhost:3001/`.

---

## Where it's going (MVP with backend)

The goal is a real product that can be shared, collaborated on, and monetized.

**Decided:**
- Backend: **Supabase** (free tier is generous, includes Storage for images, Auth built-in, PostgreSQL underneath, no own server needed)
- Monetization model: **one-time payment per memory/event** — user pays at the moment of highest emotional value, right before export. No subscriptions for v1.
- Payment: **Lemon Squeezy** (Merchant of Record, no business registration needed)
- No scope creep — features can be added after validation

**Not yet decided (intentionally deferred):**
- Whether events are single-author or collaborative
- Login required or not for v1 (leaning toward no login for simplicity)
- Exact pricing

**Status of the migration:**
- ✅ Supabase backend (DB + Storage) wired into the frontend
- ✅ Shareable URL via `#/event/<id>` (hash route, not server route)
- ✅ localforage and URL-hash sharing logic removed
- ⏳ Paywall before PDF export (Lemon Squeezy integration) — **not yet implemented**

**Why Lemon Squeezy instead of Stripe:**
Lemon Squeezy is a Merchant of Record — they are legally the seller, the developer is just the supplier. This matters because:
- **No registered business needed** to start. Stripe requires you to handle all tax obligations yourself; LS handles them for you.
- **VAT/taxes fully handled by LS.** For digital goods sold B2C in the EU, VAT applies per buyer country (not just Germany). LS calculates, collects, and remits this automatically across all jurisdictions — no EU OSS registration needed.
- **No invoicing required from our side.** LS issues the invoice to the customer.
- Tradeoff: higher fees (~5% + €0.50 vs. Stripe's ~1.5% + €0.25 in EU). Acceptable at low transaction volume.

If the product grows and a Gewerbe is registered, switching to Stripe is always possible later.

---

## Goals beyond the product

This is also a learning project. The goal is to understand:
- How backends work in practice (Supabase, auth flows, DB design)
- How to integrate payments (Lemon Squeezy)
- How to validate a product by getting someone to actually pay for it

This is the first project with a real monetization attempt. Previous project was frontend-only with no way to collect data or charge money.

---

## What to keep in mind when helping

- Recommend the simplest solution that works. No over-engineering.
- Cost matters — the developer is pre-revenue. Prefer free tiers and avoid unnecessary paid services.
- Push back on scope creep. If a feature isn't needed for the first paying customer, say so.
- The emotional quality of the product matters. Design and UX decisions should reflect that this is a product people use for meaningful moments.

## Status as of 2026-05-25

### Was in der Session vom 2026-05-25 gebaut wurde

UX-Polishing-Runde abgeschlossen. Alle Änderungen sind in `index.html` und `src/main.js`.

**Gebaut:**
- **Loading-State:** Spinner-Overlay (`#loading-overlay`) erscheint beim Laden einer Event-URL, verschwindet nach Daten-Fetch. Auf Home nicht gezeigt (Modal öffnet sofort). Entscheidung: erstmal simpler Spinner, Skeleton-Cards kommen später (steht im Backlog).
- **Error-State:** Fullscreen-Overlay (`#error-state`) bei ungültiger oder gelöschter Event-UUID (wenn Supabase einen Fehler wirft, z.B. PGRST116). Zeigt „Event nicht gefunden" + Button zum Erstellen eines neuen Events.
- **Copy-Link-Button:** Zweiter Button in der Bottom-Bar über dem Export-Button, sichtbar für alle auf einer Event-Seite (Edit und Read-only). Kopiert `window.location.href` via Clipboard API, zeigt kurz „Kopiert ✓" dann Reset. Entscheidung: für alle sichtbar, nicht nur Edit-Mode — ein Read-only-Betrachter soll den Link auch teilen können.
- **Empty-States:** In `renderMoments()` — zeigt kontextabhängige Nachricht wenn `moments.length === 0` (Edit: „Füge deinen ersten Date hinzu", Read-only: „Noch keine Dates vorhanden").
- **Extras-Sektion ausblenden:** `renderExtras()` blendet die ganze `.extra-section` aus wenn `extras.length === 0 && !canEdit`. Leere Sektion für Read-only-Besucher ergibt keinen Sinn.
- **Bottom-Bar auf Home ausblenden:** `renderHome()` setzt `#bottom-bar` auf `display: none`. Export- und Share-Button gehören nicht auf die leere Home-Seite.
- **Hardcoded Amsterdam-Text entfernt:** Hero-Spans in `index.html` sind jetzt leer by default. JS befüllt sie nach dem Laden.

**Entscheidungen:**
- Copy-Link-Button sitzt in der Bottom-Bar (nicht im Hero), damit er prominent und immer erreichbar ist.
- Error-State ist ein fixed Overlay mit z-index 800 (unter dem Loading-Overlay bei 900).
- Loading-State bleibt vorerst ein simpler Spinner — kein Skeleton, kein Shimmer. Aufwand vs. Nutzen passt nicht für jetzt.

### Status vor dieser Session (2026-05-17)

Alle Bugs #1–#11 aus `BUGS.md` erledigt. Reales Supabase-Projekt aufgesetzt, Schema applied, Bucket + drei Storage-Policies aktiv. `.env.local` lokal angelegt (gitignored). Vercel vorbereitet aber bewusst noch nicht deployed.

## Next steps (priorisiert)

1. **Design-Polishing.** UX-Struktur steht, jetzt visuelle Qualität heben. Offen: was genau — beim Durchklicken identifizieren was stört (Typografie, Abstände, Mobile-Brüche, Hero-Wirkung).
2. **Lemon Squeezy Paywall vor PDF-Export.** Skizze: PDF-Button durch „Bezahlen & Herunterladen" ersetzen wenn `is_paid = false`, LS-Checkout mit `event_id` als Custom-Data, Supabase Edge Function als Webhook-Empfänger der `is_paid = true` setzt. Account + Produkt-Setup bei Lemon Squeezy ist Voraussetzung (Klick-Arbeit, nicht Code). Spalte `is_paid` existiert bereits im Schema.
3. **Vercel-Deploy + Smoke-Test gegen Live-URL.** Repo importieren, Env-Vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) für Production/Preview/Development eintragen. Erst deployen wenn Design + Paywall fertig.

## Backlog (nicht release-blockierend)

- `check.cjs` durch `node --check` oder ESLint ersetzen.
- Mögliche „Meine Events"-Übersicht (LocalStorage-Token-Map liest schon eine JSON-Map, also einfach umsetzbar wenn gewollt).
- **Loading-State polishen:** Aktuell simpler Spinner. Soll später durch Skeleton-Cards ersetzt werden (Placeholder-Kacheln in Card-Form, grau animiert — wirkt wie die fertige Seite während sie lädt).

## Security rules (must always follow)

- **Never expose `edit_token` in frontend queries.** When reading events from Supabase, always select only the columns needed — never `select *` or include `edit_token`. The token is only returned once at INSERT time and must be stored client-side (localStorage). Leaking it in a public read response would let anyone edit or delete the event.

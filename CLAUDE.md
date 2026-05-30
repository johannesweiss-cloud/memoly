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

**Decided:**
- Preis: **3,99 € einmalig** pro Event (CTA in Paywall-Modal)

**Status of the migration:**
- ✅ Supabase backend (DB + Storage) wired into the frontend
- ✅ Shareable URL via `#/event/<id>` (hash route, not server route)
- ✅ localforage and URL-hash sharing logic removed
- ✅ Paywall + Lemon Squeezy integration **vollständig live**: LS-Account eingerichtet (`memoly.lemonsqueezy.com`), Edge Function deployed (ACTIVE), Webhook konfiguriert, E2E-Test erfolgreich
- ⏳ Vercel Deploy — noch ausstehend (erst Design-Polish)

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

## Last Session (2026-05-30)

### Was gemacht wurde

**Landingpage ist live auf Vercel — als reine Pre-Launch-Warteliste-Seite, die eigentliche App ist bewusst gesperrt.** Fokus der Session: Deployment-Tauglichkeit prüfen, App-Zugang abriegeln, Landingpage auf Mobile sauber machen.

- **Deployment-Check:** `npm run build` läuft sauber durch (Multi-Page: `index.html` + früher `app.html`). Supabase-Client wird korrekt ins Bundle gezogen, Anon-Key inlined (by design öffentlich). Warteliste schreibt in Tabelle `waitlist` (Migration `002_waitlist.sql`, RLS korrekt: anon INSERT erlaubt, SELECT gesperrt). Impressum/Datenschutz landen im Build und sind im Footer verlinkt.
- **App pre-launch abgeriegelt (dreifach):** (1) alle 6 CTA-Buttons von `/app.html` → `#start` (Warteliste) umgeleitet, (2) `app.html` aus dem Vite-Build-Input auskommentiert → die echte App + `src/`-Bundle werden gar nicht erst deployt, (3) `vercel.json` mit Redirect `/app.html` → `/`. Build schrumpfte dadurch von ~623 KB App-Bundle auf ein 1 KB Loader-Script.
- **Mobile-Overflow gefixt:** Demo-Vorschaukarte hatte fixe `width={400}` → auf allen Mobile-Viewports horizontaler Overflow (Seite ~418 px statt 375). Auf `width="100%"` + `style={{maxWidth:400}}` umgestellt (kein Desktop-Regress). Verifiziert per Playwright: `scrollWidth == innerWidth` auf 360/375/390/414.
- **Tap-Targets ≥44 px:** Nav-CTA, Demo-Export-Button und Demo-Preset-Pills von ~35–40 px auf 44 px angehoben.
- **LiveDemo-Funktion auf Mobile (Touch) verifiziert:** Aktivität eintippen → hinzufügen → erscheint in TripCard → „Als Erinnerung exportieren" zeigt Teaser-Overlay. Alles grün, keine Bugs. (Hinweis: Der Demo-„Export" ist ein bewusster Teaser ohne echtes PDF — der echte Export sitzt in der gesperrten App.)
- **Alle Sections auf Mobile durchgesehen** (Hero, How, Gallery, Pricing, FAQ, Newsletter, Footer). Ein echter Bug gefunden & gefixt: **FAQ-Überschriftsspalte war `position:sticky` (gewollt auf Desktop), blieb auf Mobile im Single-Column-Layout oben kleben → Hinweistext überlappte mit erster Frage.** Fix: im Mobile-Breakpoint `.lp-grid-faq > div:first-child{position:static !important}`.

### Key decisions & why

- **App nicht nur per Links verstecken, sondern komplett aus dem Build nehmen.** Stärkste „kein Zugriff"-Garantie: der Produktcode liegt gar nicht erst auf dem Server. Voll reversibel (eine Zeile in `vite.config.js` wieder einkommentieren). Begründung steht als Kommentar direkt im File.
- **CTAs auf Warteliste statt entfernen.** Funnelt jeden „Start"-Klick zur E-Mail-Erfassung — sammelt Interessenten während der Pre-Launch-Phase.
- **Responsive-Fixes über `!important`-Regeln im Mobile-Media-Block in `index.html`**, weil die Komponenten Inline-Styles nutzen (React-Inline-`style`-Props lassen sich sonst nicht überschreiben). Etabliertes Muster im File (`.lp-grid-*`).

### Problems & solutions

- **Element-Screenshots zeigten die sticky Nav über Section-Headlines** → zunächst als Bug vermutet. War aber ein Screenshot-Artefakt (Sektionen haben 140 px Top-Padding, Anker-Sprung landet sauber). Per Bounding-Box-Messung vom echten FAQ-Sticky-Bug unterschieden.
- **Verifikation ohne Rebuild:** Vite-Dev-Server (`localhost:3001`, strictPort) liefert `public/`-Dateien direkt aus; Änderungen an `sections.jsx`/`index.html` per Reload sofort prüfbar — kein `npm run build` für Mobile-Checks nötig.

### Files changed

- `public/sections.jsx` — 6× CTA `/app.html` → `#start`; Demo-Karte `width="100%"`/`maxWidth:400`; Tap-Targets auf 44 px. (CTA/Overflow/Tap-Commits: `b4e8be4`)
- `index.html` — FAQ-Sticky im Mobile-Breakpoint deaktiviert (`2162a44`).
- `vite.config.js` — `app.html` aus Build-Input auskommentiert (Pre-Launch-Gating).
- `vercel.json` — **neu**, Redirect `/app.html` → `/`.

## Next Steps

1. **🚨 Marketing-Plan — höchste Priorität.** Die Landingpage ist live, technisch fertig, sammelt Warteliste-E-Mails. Jetzt zählt nur noch Vertrieb:
   - Wer sind die ersten 10 Nutzer? (direktes Umfeld, Paare, Reisende)
   - Welcher Kanal für den ersten Anstoß? (Instagram, TikTok, Reddit, persönliche Empfehlung)
   - Hook-Format? (Demo-Video „So sieht das fertige PDF aus", Vorher/Nachher: Handy-Galerie vs. memoly-Export)
   - Ziel definieren: X Warteliste-Anmeldungen bzw. erste Zahlung innerhalb Y Tagen.

2. **App-Launch vorbereiten (wenn Warteliste warm ist).** Drei Handgriffe zum Freischalten: (a) `app:`-Zeile in `vite.config.js` wieder einkommentieren, (b) `vercel.json`-Redirect entfernen, (c) CTAs zurück auf `/app.html` (oder Warteliste-Logik behalten, nur Pricing-Buttons umstellen). Davor: LS-Test-Mode deaktivieren, Webhook-URL auf Production zeigen lassen.

### Open questions / blockers

- **Production-Env-Vars in Vercel gesetzt?** Verifizieren, dass `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_LS_CHECKOUT_URL` im Vercel-Projekt hinterlegt sind (sonst sind Warteliste/Checkout im Prod tot).
- **`002_waitlist.sql` auf der Live-DB angewendet?** Migrationsdatei existiert; ob im verbundenen Supabase-Projekt ausgeführt, ist nicht aus dem Repo ersichtlich — bei fehlenden Warteliste-Einträgen zuerst hier prüfen.
- Kosmetik (kein Blocker): In-Browser-Babel + CDN-React auf der Landingpage → langsamerer First Paint, Abhängigkeit von unpkg/esm.sh. Bei Traffic auf echtes Vite-JSX-Bundling umstellen.

## Backlog (nicht release-blockierend)

- `check.cjs` durch `node --check` oder ESLint ersetzen.
- Mögliche „Meine Events"-Übersicht (LocalStorage-Token-Map liest schon eine JSON-Map, also einfach umsetzbar wenn gewollt).

## Security rules (must always follow)

- **Never expose `edit_token` in frontend queries.** When reading events from Supabase, always select only the columns needed — never `select *` or include `edit_token`. The token is only returned once at INSERT time and must be stored client-side (localStorage). Leaking it in a public read response would let anyone edit or delete the event.

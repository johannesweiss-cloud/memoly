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
- ✅ Paywall before PDF export (Lemon Squeezy integration) — **frontend + Edge Function done; needs LS account setup to go live**

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

## Last Session (2026-05-25)

### Was gebaut / geändert wurde

Lemon Squeezy Paywall vollständig implementiert (Frontend + Supabase Edge Function). Außerdem PDF-Themes und Titelseite mit Playwright verifiziert.

**PDF-Qualitätsprüfung (kein Code geändert):**
- Alle drei PDF-Themes (Modern, Romantic, Scrapbook) mit Playwright exportiert und visuell verglichen — alle korrekt und deutlich unterschiedlich.
- Titelseite (Deckblatt) war bereits implementiert und funktioniert korrekt: eigene A4-Seite pro Theme, mit passendem Hintergrund und Typografie.
- Export-Modal mit Theme-Picker, Layout-Wahl und Deckblatt-Toggle bereits vorhanden.

**Lemon Squeezy Paywall — neu implementiert:**

*Frontend (`index.html`, `src/main.js`):*
- `renderEvent()` setzt den Export-Button jetzt abhängig von `canEdit` und `is_paid`:
  - `!canEdit` → Button ausgeblendet (Lesende sehen keinen Export-Button)
  - `canEdit && !is_paid` → Amber-farbener Button „✦ Buch freischalten & exportieren" (Klasse `export-btn--locked`)
  - `canEdit && is_paid` → Normaler dunkler Export-Button wie zuvor
- Paywall-Modal (Bottom Sheet): ✦-Icon, Titel, Beschreibung, 4 Feature-Punkte mit Checkmarks, Amber-CTA „Jetzt freischalten — 3,99 €“, „Sicher & verschlüsselt · Lemon Squeezy“-Footer, „Vielleicht später“-Abbrechen.
- `startCheckout()`: öffnet Lemon Squeezy Overlay via `window.LemonSqueezy.Url.Open(url)` (Fallback: `window.open`). URL enthält `event_id` als Custom-Data (`?checkout[custom][event_id]=...&embed=1`). Checkout-URL kommt aus `VITE_LS_CHECKOUT_URL`.
- `pollForPayment()`: polling alle 2 Sekunden für max. 60 Sekunden auf `is_paid = true`. Wenn bestätigt: `renderEvent()` neu aufrufen + Export-Modal automatisch öffnen.
- Lemon Squeezy JS (`https://app.lemonsqueezy.com/js/lemon.js`) als `defer`-Script eingebunden.
- `.modal-sheet` bekommt `max-height: 88vh; overflow-y: auto` — verhindert dass tall Modals über die Viewport-Oberkante hinauswachsen.

*Supabase Edge Function (`supabase/functions/lemon-webhook/index.ts`) — neu:*
- Empfängt Webhook von Lemon Squeezy nach erfolgreicher Zahlung.
- Verifiziert HMAC-SHA256-Signatur gegen `LEMON_WEBHOOK_SECRET`.
- Ignoriert alle Events außer `order_created`.
- Liest `meta.custom_data.event_id` und setzt `is_paid = true` via Service-Role-Key (umgeht RLS).
- `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` werden von Supabase automatisch injiziert.

**Entscheidungen:**
- **Hard-Gate statt Wasserzeichen**: Nutzer hat 30–60 Minuten investiert → maximale Zahlungsbereitschaft genau vor dem Export. Kein Wasserzeichen nötig.
- **Polling statt Supabase Realtime**: 5 Zeilen vs. vollständige Subscription-Verwaltung. Zuverlässiger bei Tab-Wechsel nach dem Checkout-Overlay.
- **Kein Aktivitäten-Limit**: Limit schafft Reibung vor dem emotionalen Investment. Nur der Export wird gegattet.
- **Export für Lesende ausgeblendet**: Nur der Ersteller (Edit-Token vorhanden) kann exportieren.

**Probleme & Lösungen:**
- Playwright-Test zeigte Modal bei `top: -372` → kein echter Bug, `scrollIntoView()` im Test hatte das Overlay verschoben. Ohne diesen Call erscheint das Modal korrekt bei `top: 322`.

**Files changed:**
- `index.html` — Paywall-CSS, Paywall-Modal-HTML, LS-Script-Tag, `max-height` für `.modal-sheet`
- `src/main.js` — `LS_CHECKOUT_URL` Env-Var, `renderEvent()` Button-State-Logik, `openPaywallModal/closePaywallModal`, `startCheckout`, `pollForPayment`, Event-Listener für Paywall-Buttons
- `supabase/functions/lemon-webhook/index.ts` — neu
- `.env.local` — Placeholder `VITE_LS_CHECKOUT_URL=` (muss nach LS-Setup befüllt werden)

## Next Steps

1. **Lemon Squeezy Account + Produkt einrichten (Klick-Arbeit):**
   - Account unter app.lemonsqueezy.com anlegen
   - Store erstellen, Produkt „memoly Premium Export“ (3,99 €, einmalig) anlegen → Variant-ID notieren
   - Buy-URL in `.env.local` ein tragen: `VITE_LS_CHECKOUT_URL=https://dein-store.lemonsqueezy.com/buy/VARIANT_ID`

2. **Edge Function deployen + Webhook konfigurieren:**
   ```
   supabase functions deploy lemon-webhook
   supabase secrets set LEMON_WEBHOOK_SECRET=dein-webhook-secret
   ```
   Im LS-Dashboard Webhook anlegen: URL `https://vddmjeihfsmibtcwxaaa.supabase.co/functions/v1/lemon-webhook`, Event `order_created`, Secret eintragen.

3. **End-to-End-Test mit echter Zahlung** (LS hat Test-Mode): Paywall-Flow durchspielen, prüfen dass `is_paid = true` in Supabase gesetzt wird und Export freigeschaltet wird.

4. **Vercel-Deploy:** Repo importieren, Env-Vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_LS_CHECKOUT_URL` für Production/Preview/Development eintragen.

## Backlog (nicht release-blockierend)

- `check.cjs` durch `node --check` oder ESLint ersetzen.
- Mögliche „Meine Events"-Übersicht (LocalStorage-Token-Map liest schon eine JSON-Map, also einfach umsetzbar wenn gewollt).
- **Loading-State polishen:** Aktuell simpler Spinner. Soll später durch Skeleton-Cards ersetzt werden (Placeholder-Kacheln in Card-Form, grau animiert — wirkt wie die fertige Seite während sie lädt).

## Security rules (must always follow)

- **Never expose `edit_token` in frontend queries.** When reading events from Supabase, always select only the columns needed — never `select *` or include `edit_token`. The token is only returned once at INSERT time and must be stored client-side (localStorage). Leaking it in a public read response would let anyone edit or delete the event.

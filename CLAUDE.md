# CLAUDE.md — Erinnerungen App (Arbeitstitel)

This file gives Claude context about this project: what it is, where it's going, and what decisions have already been made.

---

## What this product is

A web app that turns a shared experience (a date, trip, family outing) into a beautiful, curated memory book — with photos, titles, and descriptions per moment — that can be exported and actually looked at again, unlike photos that get lost in a phone gallery.

**Core emotional insight:** People take hundreds of photos but rarely revisit them. This product forces curation and adds context, making the memory worth keeping.

**Primary target audience:** Couples (highest emotional resonance), but also groups, families, and friend circles.

---

## Current state (v0 — proof of concept)

The existing codebase is a single-file static web app (`index.html`) built as a birthday gift. It has no backend.

**What it already does:**
- Create an event with a title, subtitle, and tag
- Add "date" cards: each has a title, description, and one photo
- Add an "extras" photo grid at the end
- Export everything as a formatted PDF (jsPDF, A4, alternating image-left/right layout)
- Share via URL hash (base64-encoded JSON) — images are stripped from the payload, recipients upload their own

**Key technical details of v0:**
- All state in localforage (IndexedDB), scoped by `eventId`
- Images resized client-side via Canvas before storage (max 1800px, JPEG 0.88)
- No login, no server, no persistence beyond the local device
- Dependencies via CDN: localforage, jsPDF, Google Fonts

---

## Where it's going (MVP with backend)

The goal is a real product that can be shared, collaborated on, and monetized.

**Decided:**
- Backend: **Supabase** (free tier is generous, includes Storage for images, Auth built-in, PostgreSQL underneath, no own server needed)
- Monetization model: **one-time payment per memory/event** — user pays at the moment of highest emotional value, right before export. No subscriptions for v1.
- Payment: **Stripe**
- No scope creep — features can be added after validation

**Not yet decided (intentionally deferred):**
- Whether events are single-author or collaborative
- Login required or not for v1 (leaning toward no login for simplicity)
- Exact pricing

**What changes with the backend:**
- Images stored in Supabase Storage instead of base64 in localforage
- Events stored in Supabase DB with a real shareable URL (`/event/<id>`) instead of URL hash trick
- Paywall before PDF export (Stripe integration)
- localforage and URL-hash sharing logic gets removed

---

## Goals beyond the product

This is also a learning project. The goal is to understand:
- How backends work in practice (Supabase, auth flows, DB design)
- How to integrate payments (Stripe)
- How to validate a product by getting someone to actually pay for it

This is the first project with a real monetization attempt. Previous project was frontend-only with no way to collect data or charge money.

---

## What to keep in mind when helping

- Recommend the simplest solution that works. No over-engineering.
- Cost matters — the developer is pre-revenue. Prefer free tiers and avoid unnecessary paid services.
- Push back on scope creep. If a feature isn't needed for the first paying customer, say so.
- The emotional quality of the product matters. Design and UX decisions should reflect that this is a product people use for meaningful moments.

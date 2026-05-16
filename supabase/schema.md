# Database Schema Reference

## Overview

Three tables. No auth users — events are anonymous, protected by a secret `edit_token` the client receives at creation and must keep.

Share URL: `/event/<events.id>` (public)  
Edit access: caller sends `X-Edit-Token: <edit_token>` header with every write request.

---

## `events`

| Column       | Type        | Notes                                      |
|--------------|-------------|--------------------------------------------|
| `id`         | uuid PK     | Public share ID (`/event/<id>`)            |
| `edit_token` | uuid        | Secret; never exposed in read responses — client stores this locally |
| `title`      | text        | Required                                   |
| `subtitle`   | text        | Optional                                   |
| `tag`        | text        | Short label, e.g. "Weekend Trip"           |
| `created_at` | timestamptz |                                            |
| `updated_at` | timestamptz | Auto-updated via trigger                   |

RLS: anyone can read; write requires matching `edit_token` in `X-Edit-Token` header.

---

## `moments`

One row per "date card" (photo + title + description).

| Column        | Type        | Notes                                           |
|---------------|-------------|-------------------------------------------------|
| `id`          | uuid PK     |                                                 |
| `event_id`    | uuid FK     | → `events.id`, cascades on delete               |
| `title`       | text        | Required                                        |
| `description` | text        | Optional                                        |
| `sort_order`  | integer     | Client controls display order                   |
| `image_path`  | text        | Path in `event-images` bucket, nullable         |
| `created_at`  | timestamptz |                                                 |
| `updated_at`  | timestamptz | Auto-updated via trigger                        |

RLS: anyone can read; write requires `edit_token` of parent event.

---

## `extras`

Extra photos shown as a grid at the end of the memory book (no title/description).

| Column       | Type        | Notes                                           |
|--------------|-------------|-------------------------------------------------|
| `id`         | uuid PK     |                                                 |
| `event_id`   | uuid FK     | → `events.id`, cascades on delete               |
| `sort_order` | integer     | Client controls display order                   |
| `image_path` | text        | Path in `event-images` bucket, nullable         |
| `created_at` | timestamptz |                                                 |
| `updated_at` | timestamptz | Auto-updated via trigger                        |

RLS: same as `moments`.

---

## RLS summary

| Table     | SELECT | INSERT | UPDATE | DELETE |
|-----------|--------|--------|--------|--------|
| events    | public | public | edit_token | edit_token |
| moments   | public | edit_token | edit_token | edit_token |
| extras    | public | edit_token | edit_token | edit_token |

`edit_token` = value in `X-Edit-Token` request header must match `events.edit_token`.

---

## Indexes

- `events(edit_token)` — write-path lookup
- `moments(event_id)` — fetch all moments for an event
- `extras(event_id)` — fetch all extras for an event

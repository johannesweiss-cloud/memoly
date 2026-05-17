-- memoly initial schema
-- Anonymous authoring via edit_token (no login required for v1)

-- ============================================================
-- TABLES
-- ============================================================

create table events (
  id            uuid primary key default gen_random_uuid(),
  edit_token    uuid not null default gen_random_uuid(),
  title         text not null,
  subtitle      text,
  tag           text,
  is_paid       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table moments (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events(id) on delete cascade,
  title         text not null,
  description   text,
  sort_order    integer not null default 0,
  image_path    text,   -- path within the "event-images" bucket
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table extras (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events(id) on delete cascade,
  sort_order    integer not null default 0,
  image_path    text,   -- path within the "event-images" bucket
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index moments_event_id_idx on moments(event_id);
create index extras_event_id_idx  on extras(event_id);

-- Keep edit_token lookups fast (used on every write)
create index events_edit_token_idx on events(edit_token);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at  before update on events  for each row execute function set_updated_at();
create trigger moments_updated_at before update on moments for each row execute function set_updated_at();
create trigger extras_updated_at  before update on extras  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table events  enable row level security;
alter table moments enable row level security;
alter table extras  enable row level security;

-- ---------- events ----------

-- Anyone can read events
create policy "events: public read"
  on events for select
  using (true);

-- Insert is open (no auth) — the client receives the edit_token and must store it
create policy "events: public insert"
  on events for insert
  with check (true);

-- Update / delete only if the caller supplies the matching edit_token via request header
-- Header: X-Edit-Token: <uuid>
-- Supabase exposes request headers via current_setting()
create policy "events: edit_token update"
  on events for update
  using (edit_token::text = current_setting('request.headers', true)::json->>'x-edit-token')
  with check (edit_token::text = current_setting('request.headers', true)::json->>'x-edit-token');

create policy "events: edit_token delete"
  on events for delete
  using (edit_token::text = current_setting('request.headers', true)::json->>'x-edit-token');

-- ---------- moments ----------

create policy "moments: public read"
  on moments for select
  using (true);

-- Write access: event must exist and caller must know its edit_token
create policy "moments: edit_token write"
  on moments for insert
  with check (
    exists (
      select 1 from events
      where id = moments.event_id
        and edit_token::text = current_setting('request.headers', true)::json->>'x-edit-token'
    )
  );

create policy "moments: edit_token update"
  on moments for update
  using (
    exists (
      select 1 from events
      where id = moments.event_id
        and edit_token::text = current_setting('request.headers', true)::json->>'x-edit-token'
    )
  );

create policy "moments: edit_token delete"
  on moments for delete
  using (
    exists (
      select 1 from events
      where id = moments.event_id
        and edit_token::text = current_setting('request.headers', true)::json->>'x-edit-token'
    )
  );

-- ---------- extras ----------

create policy "extras: public read"
  on extras for select
  using (true);

create policy "extras: edit_token write"
  on extras for insert
  with check (
    exists (
      select 1 from events
      where id = extras.event_id
        and edit_token::text = current_setting('request.headers', true)::json->>'x-edit-token'
    )
  );

create policy "extras: edit_token update"
  on extras for update
  using (
    exists (
      select 1 from events
      where id = extras.event_id
        and edit_token::text = current_setting('request.headers', true)::json->>'x-edit-token'
    )
  );

create policy "extras: edit_token delete"
  on extras for delete
  using (
    exists (
      select 1 from events
      where id = extras.event_id
        and edit_token::text = current_setting('request.headers', true)::json->>'x-edit-token'
    )
  );

-- ============================================================
-- STORAGE ROW LEVEL SECURITY
-- ============================================================

-- Lesen (SELECT) erlauben - wird zwingend für "upsert: true" benötigt!
create policy "Anyone can read event-images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'event-images');

-- Upload (INSERT) erlauben
create policy "Anyone can upload to event-images"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'event-images');

-- Re-Upload (upsert: true -> UPDATE) erlauben
create policy "Anyone can update event-images"
  on storage.objects for update to anon, authenticated
  using (bucket_id = 'event-images')
  with check (bucket_id = 'event-images');


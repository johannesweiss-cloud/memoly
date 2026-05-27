-- memoly waitlist schema
-- Stores email addresses of people who sign up on the landing page

create table waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  created_at  timestamptz not null default now()
);

-- Enable Row Level Security
alter table waitlist enable row level security;

-- Allow anyone to insert into the waitlist (public access)
create policy "Anyone can join waitlist"
  on waitlist for insert
  with check (true);

-- Deny read/update/delete to the public (only service-role can read/manage)
create policy "Only admin can read waitlist"
  on waitlist for select
  using (false);

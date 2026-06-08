-- ── MIGRATION: Fix RLS policies for replies and reactions ────────────────────
-- Run this in the Supabase SQL Editor.
-- Allows public read and write access (same pattern as your other tables).

-- ── REPLIES ──────────────────────────────────────────────────────────────────
alter table replies enable row level security;

drop policy if exists "Allow public read on replies" on replies;
drop policy if exists "Allow public insert on replies" on replies;

create policy "Allow public read on replies"
  on replies for select
  using (true);

create policy "Allow public insert on replies"
  on replies for insert
  with check (true);

-- ── REACTIONS ────────────────────────────────────────────────────────────────
alter table reactions enable row level security;

drop policy if exists "Allow public read on reactions" on reactions;
drop policy if exists "Allow public insert on reactions" on reactions;
drop policy if exists "Allow public upsert on reactions" on reactions;

create policy "Allow public read on reactions"
  on reactions for select
  using (true);

create policy "Allow public insert on reactions"
  on reactions for insert
  with check (true);

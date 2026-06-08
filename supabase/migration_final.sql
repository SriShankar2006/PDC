-- ── MIGRATION: Fix replies table + RLS (safe re-run) ─────────────────────────

-- ── REPLIES ──────────────────────────────────────────────────────────────────
drop table if exists replies cascade;

create table replies (
  id          uuid primary key default gen_random_uuid(),
  answer_id   uuid not null references answers(id) on delete cascade,
  content     text not null,
  author_name text,
  created_at  timestamptz default now()
);

create index replies_answer_id_idx on replies (answer_id);

alter table replies enable row level security;

drop policy if exists "Allow public read on replies" on replies;
drop policy if exists "Allow public insert on replies" on replies;

create policy "Allow public read on replies"
  on replies for select using (true);

create policy "Allow public insert on replies"
  on replies for insert with check (true);

-- ── REACTIONS ────────────────────────────────────────────────────────────────
create table if not exists reactions (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  emoji       text not null,
  user_id     text not null,
  created_at  timestamptz default now(),
  unique (question_id, user_id, emoji)
);

alter table reactions enable row level security;

drop policy if exists "Allow public read on reactions" on reactions;
drop policy if exists "Allow public insert on reactions" on reactions;
drop policy if exists "Allow public upsert on reactions" on reactions;

create policy "Allow public read on reactions"
  on reactions for select using (true);

create policy "Allow public insert on reactions"
  on reactions for insert with check (true);

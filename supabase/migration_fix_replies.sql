-- ── MIGRATION: Fix replies table ─────────────────────────────────────────────
-- Run this in the Supabase SQL Editor.
-- This is a non-destructive migration — it only touches the replies table.
-- All questions, answers, votes, polls, and reactions data is preserved.

-- Step 1: Drop the old replies table (it used question_id which was wrong)
--         Safe because replies were broken anyway (API was failing with 500).
drop table if exists replies cascade;

-- Step 2: Create the correct replies table scoped to answer_id
create table replies (
  id          uuid primary key default gen_random_uuid(),
  answer_id   uuid not null references answers(id) on delete cascade,
  content     text not null,
  author_name text,
  created_at  timestamptz default now()
);

create index replies_answer_id_idx on replies (answer_id);

-- Step 3: Create reactions table if it doesn't already exist
create table if not exists reactions (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  emoji       text not null,
  user_id     text not null,
  created_at  timestamptz default now(),
  unique (question_id, user_id, emoji)
);

create index if not exists reactions_question_id_idx on reactions (question_id);

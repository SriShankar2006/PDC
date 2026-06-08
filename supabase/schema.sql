-- Day 5 schema — run this once in the Supabase SQL Editor.
-- Resets the environment, creates relational tables, structures robust
-- constraints, adds GIN indexes, and seeds 25 questions along with initial answers.

-- ── RESET EXISTING ENVIRONMENT ──────────────────────────────────────────────
drop table if exists poll_votes cascade;
drop table if exists poll_options cascade;
drop table if exists polls cascade;
drop table if exists reactions cascade;
drop table if exists replies cascade;
drop table if exists votes cascade;
drop table if exists answers cascade;
drop table if exists questions cascade;

-- ── QUESTIONS TABLE (Feature 1) ──────────────────────────────────────────────
create table questions (
  id          uuid primary key default gen_random_uuid(),
  body        text not null,
  author      text,
  pinned      boolean default false,
  created_at  timestamptz default now()
);

-- ── ANSWERS TABLE (Feature 2 - Dependency for questions.ts) ──────────────────
create table answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  answer_text text not null,
  created_at  timestamptz default now()
);

create index answers_question_id_idx on answers (question_id);

-- ── VOTES TABLE (Feature 3) ──────────────────────────────────────────────────
create table votes (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references questions(id) on delete cascade,
  voter_id     text not null,
  direction    integer not null default 1,
  created_at   timestamptz default now(),
  unique (question_id, voter_id)
);

create index votes_question_id_idx on votes (question_id);

-- ── REACTIONS TABLE (Feature 4) ──────────────────────────────────────────────
create table reactions (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  emoji       text not null,
  user_id     text not null,
  created_at  timestamptz default now(),
  unique (question_id, user_id, emoji)
);

create index reactions_question_id_idx on reactions (question_id);

-- ── REPLIES TABLE (Feature 5) ─────────────────────────────────────────────────
-- Replies are scoped to an answer (answer_id). The API route uses the [id]
-- segment as the answer_id so each answer has its own independent reply thread.
create table replies (
  id          uuid primary key default gen_random_uuid(),
  answer_id   uuid not null references answers(id) on delete cascade,
  content     text not null,
  author_name text,
  created_at  timestamptz default now()
);

create index replies_answer_id_idx on replies (answer_id);

-- ── POLLS & POLL OPTIONS TABLES (Feature 6) ──────────────────────────────────
create table polls (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  created_at  timestamptz default now()
);

create table poll_options (
  id        uuid primary key default gen_random_uuid(),
  poll_id   uuid not null references polls(id) on delete cascade,
  label     text not null,
  position  integer not null default 0,
  unique (poll_id, id),
  unique (poll_id, position)
);

create table poll_votes (
  id             uuid primary key default gen_random_uuid(),
  poll_id        uuid not null references polls(id) on delete cascade,
  poll_option_id uuid not null,
  voter_id       text not null,
  created_at     timestamptz default now(),
  unique (poll_id, voter_id),
  foreign key (poll_id, poll_option_id)
    references poll_options(poll_id, id)
    on delete cascade
);

create index poll_votes_poll_id_idx on poll_votes (poll_id);
create index poll_votes_poll_option_id_idx on poll_votes (poll_option_id);

-- ── FULL-TEXT SEARCH INDEX ────────────────────────────────────────────────────
create index questions_fts_idx on questions using gin (to_tsvector('english', body));

-- ── DATA SEED RITUALS (~25 questions with ordered timestamps) ────────────────
insert into questions (body, author, created_at)
select body, author, now() - (n || ' minutes')::interval
from (
  values
    (1,  'How do I deploy to Vercel?', 'Priya'),
    (2,  'What''s the difference between server and client components?', 'Marcus'),
    (3,  'When should I add a database index?', 'Aisha'),
    (4,  'How does Postgres full-text search work?', 'Diego'),
    (5,  'Why did my in-memory data vanish on restart?', 'Lena'),
    (6,  'Should I store a vote count or count vote rows?', 'Sam'),
    (7,  'What is a unique constraint good for?', 'Priya'),
    (8,  'How do I prevent double voting?', 'Noah'),
    (9,  'What''s the difference between SSR and hydration?', 'Aisha'),
    (10, 'How does optimistic UI actually work?', 'Marcus'),
    (11, 'When do I really need pagination?', 'Ravi'),
    (12, 'Offset vs cursor pagination — which one?', 'Lena'),
    (13, 'How do I debounce a search input?', 'Diego'),
    (14, 'Why must secrets stay on the server?', 'Sam'),
    (15, 'What is row-level security in Supabase?', 'Noah'),
    (16, 'How does connection pooling help on Vercel?', 'Priya'),
    (17, 'What is a GIN index and when do I use it?', 'Ravi'),
    (18, 'How do foreign keys protect my data?', 'Aisha'),
    (19, 'When should I move counts into Redis?', 'Marcus'),
    (20, 'How do I run a database migration safely?', 'Lena'),
    (21, 'What does on delete cascade actually do?', 'Diego'),
    (22, 'How do I seed test data quickly?', 'Sam'),
    (23, 'Why is my Vercel function cold starting?', 'Noah'),
    (24, 'How do I scale reads with replicas?', 'Ravi'),
    (25, 'What''s the best way to add auth later?', 'Priya')
) as seed(n, body, author);

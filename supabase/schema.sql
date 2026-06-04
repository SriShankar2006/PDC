-- Day 5 schema — run this once in the Supabase SQL Editor.
-- It resets to a clean slate (drops the previous experiment), creates the
-- tables in the shape the guide uses (votes as ROWS, not a column), adds the
-- indexes, and seeds 25 questions so pagination and search have volume.

-- ── reset ──────────────────────────────────────────────────────────────────
drop table if exists votes;
drop table if exists questions cascade;
drop function if exists increment_question_votes(uuid);

-- ── questions (Feature 1) ────────────────────────────────────────────────────
create table questions (
  id          uuid primary key default gen_random_uuid(),
  body        text not null,
  author      text,
  created_at  timestamptz default now()
);

-- ── votes (Feature 3) ────────────────────────────────────────────────────────
-- one row per vote; the FK guarantees a vote points at a real question, and
-- the unique constraint enforces one vote per voter per question.
create table votes (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references questions(id) on delete cascade,
  voter_id     text not null,
  created_at   timestamptz default now(),
  unique (question_id, voter_id)
);

create index votes_question_id_idx on votes (question_id);

-- ── full-text search index (Feature 5) ───────────────────────────────────────
-- GIN = Generalized INverted index: the word → documents map behind search.
create index questions_fts_idx on questions using gin (to_tsvector('english', body));

-- ── seed (~25 questions, spaced out in time so ordering is stable) ───────────
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

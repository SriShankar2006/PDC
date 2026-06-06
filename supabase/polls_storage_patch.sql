-- Run this once in the Supabase SQL Editor for an existing database.
-- It preserves current polls, stabilizes option ordering, and prevents votes
-- from pointing to an option that belongs to a different poll.

alter table poll_options
  add column if not exists position integer;

with ranked_options as (
  select
    id,
    row_number() over (partition by poll_id order by id) - 1 as next_position
  from poll_options
)
update poll_options
set position = ranked_options.next_position
from ranked_options
where poll_options.id = ranked_options.id
  and poll_options.position is null;

alter table poll_options
  alter column position set default 0,
  alter column position set not null;

delete from poll_votes
where not exists (
  select 1
  from poll_options
  where poll_options.id = poll_votes.poll_option_id
    and poll_options.poll_id = poll_votes.poll_id
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'poll_options_poll_id_id_key'
  ) then
    alter table poll_options
      add constraint poll_options_poll_id_id_key unique (poll_id, id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'poll_options_poll_id_position_key'
  ) then
    alter table poll_options
      add constraint poll_options_poll_id_position_key unique (poll_id, position);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'poll_votes_poll_id_poll_option_id_fkey'
  ) then
    alter table poll_votes
      drop constraint if exists poll_votes_poll_option_id_fkey;

    alter table poll_votes
      add constraint poll_votes_poll_id_poll_option_id_fkey
      foreign key (poll_id, poll_option_id)
      references poll_options(poll_id, id)
      on delete cascade;
  end if;
end $$;

create index if not exists poll_votes_poll_option_id_idx
  on poll_votes (poll_option_id);

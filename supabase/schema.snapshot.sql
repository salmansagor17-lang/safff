-- بيت سيدو / Family Challenge
-- App-owned schema snapshot — v0.15.1 — 2026-09-25
-- Supabase-managed auth/storage schemas and secrets are intentionally excluded.

create table if not exists public.games (
  id text primary key,
  title text not null,
  description text not null default '',
  icon text not null default '🎮',
  status text not null default 'ready' check (status in ('ready','coming','hidden')),
  settings jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.game_categories (
  id text primary key,
  game_id text not null references public.games(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  image_path text,
  image_alt text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  unique (game_id,title)
);


create table if not exists public.game_difficulty_levels (
  game_id text not null references public.games(id) on delete cascade,
  points integer not null,
  label_ar text not null,
  label_en text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  primary key (game_id, points)
);

create table if not exists public.game_session_settings (
  game_id text primary key references public.games(id) on delete cascade,
  default_timer_seconds integer not null,
  allow_no_timer boolean not null default true,
  timer_options jsonb not null default '[0,15,30,45,60]'::jsonb,
  default_questions_per_level integer not null default 2,
  questions_per_level_options jsonb not null default '[1,2,3,4]'::jsonb,
  default_questions_per_category integer not null default 6,
  questions_per_category_options jsonb not null default '[3,6,9,12]'::jsonb,
  min_categories integer not null default 2,
  max_categories integer not null default 5,
  updated_at timestamptz not null default now()
);

create table if not exists public.game_questions (
  id text primary key,
  game_id text not null references public.games(id) on delete cascade,
  category_id text not null references public.game_categories(id) on delete cascade,
  points integer not null default 100,
  type text not null default 'text' check (type in ('text','multiple-choice','true-false')),
  question text not null,
  answer text not null,
  options jsonb not null default '[]'::jsonb,
  media_type text not null default 'none' check (media_type in ('none','image','audio')),
  media_path text,
  media_alt text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.question_answers (
  id bigint generated always as identity primary key,
  question_id text not null references public.game_questions(id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  category_id text not null references public.game_categories(id) on delete cascade,
  language_code text not null check (language_code in ('ar','en')),
  answer_text text not null,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(question_id, language_code)
);

create table if not exists public.question_media (
  id bigint generated always as identity primary key,
  question_id text not null references public.game_questions(id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  category_id text not null references public.game_categories(id) on delete cascade,
  stage text not null check (stage in ('question','answer')),
  media_type text not null default 'image' check (media_type in ('image','audio')),
  provider text not null default 'supabase' check (provider in ('supabase','external','wikipedia-search')),
  media_path text,
  external_url text,
  lookup_query text,
  fallback_query text,
  alt text not null default '',
  source_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(question_id, stage, sort_order),
  check (
    (provider='supabase' and media_path is not null)
    or (provider='external' and external_url is not null)
    or (provider='wikipedia-search' and lookup_query is not null)
  )
);

create table if not exists public.feedback (
  id bigint primary key,
  game_id text references public.games(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1200),
  app_version text not null default '0.15.1',
  created_at timestamptz not null default now()
);

create index if not exists game_categories_game_sort_idx on public.game_categories(game_id,sort_order);
create index if not exists game_questions_category_id_idx on public.game_questions(category_id);
create index if not exists game_questions_game_category_sort_idx on public.game_questions(game_id,category_id,sort_order);
create index if not exists question_answers_game_category_idx on public.question_answers(game_id,category_id,question_id);
create index if not exists question_media_game_category_stage_idx on public.question_media(game_id,category_id,stage,active,question_id);
create index if not exists question_answers_category_id_idx on public.question_answers(category_id);
create index if not exists question_media_category_id_idx on public.question_media(category_id);
create index if not exists feedback_game_id_idx on public.feedback(game_id);

alter table public.games enable row level security;
alter table public.game_categories enable row level security;
alter table public.game_questions enable row level security;
alter table public.game_difficulty_levels enable row level security;
alter table public.game_session_settings enable row level security;
alter table public.question_answers enable row level security;
alter table public.question_media enable row level security;
alter table public.feedback enable row level security;

-- Category administration views. security_invoker makes them respect game_questions RLS.
create or replace view public.vw_content_overview with (security_invoker=true) as
select c.id category_id,c.title,c.sort_order,
 count(q.*) filter(where q.active)::int active_questions,
 count(q.*) filter(where q.active and q.points=100)::int p100,
 count(q.*) filter(where q.active and q.points=300)::int p300,
 count(q.*) filter(where q.active and q.points=500)::int p500,
 count(distinct q.answer) filter(where q.active)::int distinct_answers
from public.game_categories c left join public.game_questions q on q.category_id=c.id
where c.game_id='family-challenge' and c.active=true
group by c.id,c.title,c.sort_order;

create or replace view public.vw_questions_general       with (security_invoker=true) as select * from public.game_questions where category_id='fc-general';
create or replace view public.vw_questions_geography     with (security_invoker=true) as select * from public.game_questions where category_id='fc-geography';
create or replace view public.vw_questions_history       with (security_invoker=true) as select * from public.game_questions where category_id='fc-history';
create or replace view public.vw_questions_fruits        with (security_invoker=true) as select * from public.game_questions where category_id='fc-image-fruits';
create or replace view public.vw_questions_landmarks     with (security_invoker=true) as select * from public.game_questions where category_id='fc-image-landmarks';
create or replace view public.vw_questions_animals       with (security_invoker=true) as select * from public.game_questions where category_id='fc-image-animals';
create or replace view public.vw_questions_islamic       with (security_invoker=true) as select * from public.game_questions where category_id='fc-islamic';
create or replace view public.vw_questions_riddles       with (security_invoker=true) as select * from public.game_questions where category_id='fc-riddles';
create or replace view public.vw_questions_sports        with (security_invoker=true) as select * from public.game_questions where category_id='fc-sports';
create or replace view public.vw_questions_flags         with (security_invoker=true) as select * from public.game_questions where category_id='fc-image-flags';
create or replace view public.vw_questions_symbols       with (security_invoker=true) as select * from public.game_questions where category_id='fc-symbols';
create or replace view public.vw_questions_bab_al_hara   with (security_invoker=true) as select * from public.game_questions where category_id='fc-bab-al-hara';
create or replace view public.vw_questions_makeup        with (security_invoker=true) as select * from public.game_questions where category_id='fc-makeup';
create or replace view public.vw_questions_disney        with (security_invoker=true) as select * from public.game_questions where category_id='fc-disney';
create or replace view public.vw_questions_math          with (security_invoker=true) as select * from public.game_questions where category_id='fc-math';
create or replace view public.vw_questions_science       with (security_invoker=true) as select * from public.game_questions where category_id='fc-science';
create or replace view public.vw_questions_seerah        with (security_invoker=true) as select * from public.game_questions where category_id='fc-seerah';
create or replace view public.vw_questions_quran_stories with (security_invoker=true) as select * from public.game_questions where category_id='fc-quran-stories';
create or replace view public.vw_questions_currencies    with (security_invoker=true) as select * from public.game_questions where category_id='fc-currencies';
create or replace view public.vw_questions_prison_break  with (security_invoker=true) as select * from public.game_questions where category_id='fc-prison-break';

-- Live policies in the connected project:
-- games/category/questions: public SELECT of active rows only.
-- question_answers: SELECT only when the linked game_questions row is active.
-- question_media: SELECT only when media + linked question are active.
-- feedback: public INSERT with rating/comment validation; no public SELECT.

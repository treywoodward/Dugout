-- ============================================================
-- Dugout — Supabase Schema
-- Paste this entire file into Supabase SQL Editor and run it.
-- ============================================================

-- Teams
create table if not exists teams (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- Players
create table if not exists players (
  id             uuid primary key default gen_random_uuid(),
  team_id        uuid not null references teams(id) on delete cascade,
  name           text not null,
  jersey_number  integer,
  position       text,
  created_at     timestamptz not null default now()
);

-- Games
create table if not exists games (
  id               uuid primary key default gen_random_uuid(),
  team_id          uuid not null references teams(id) on delete cascade,
  opponent_name    text not null,
  game_date        date not null,
  status           text not null default 'in_progress', -- in_progress | completed
  home_away        text,                                -- home | away
  final_score_us   integer,
  final_score_them integer,
  created_at       timestamptz not null default now()
);

-- At-bats
create table if not exists at_bats (
  id             uuid primary key default gen_random_uuid(),
  game_id        uuid not null references games(id) on delete cascade,
  batter_id      uuid not null references players(id) on delete cascade,
  pitcher_id     uuid references players(id) on delete set null,
  inning         integer not null,
  result         text not null, -- single | double | triple | home_run | strikeout | out | walk | hbp
  hit_type       text,          -- mirrors result for hits
  rbis           integer not null default 0,
  direction      text,          -- left | center | right | infield
  out_type       text,          -- groundout | flyout | lineout | popup | force | double_play
  balls_before   integer,
  strikes_before integer,
  created_at     timestamptz not null default now()
);

-- Defensive plays
create table if not exists defensive_plays (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references games(id) on delete cascade,
  player_id   uuid references players(id) on delete set null,
  play_type   text not null, -- error | assist | stolen_base | wild_pitch | passed_ball | double_play
  inning      integer,
  description text,
  created_at  timestamptz not null default now()
);

-- Per-player stats per game (aggregated)
create table if not exists player_game_stats (
  id            uuid primary key default gen_random_uuid(),
  game_id       uuid not null references games(id) on delete cascade,
  player_id     uuid not null references players(id) on delete cascade,
  at_bats       integer not null default 0,
  hits          integer not null default 0,
  runs          integer not null default 0,
  rbis          integer not null default 0,
  walks         integer not null default 0,
  strikeouts    integer not null default 0,
  home_runs     integer not null default 0,
  doubles       integer not null default 0,
  triples       integer not null default 0,
  errors        integer not null default 0,
  stolen_bases  integer not null default 0,
  created_at    timestamptz not null default now(),
  unique(game_id, player_id)
);

-- Per-pitcher stats per game
create table if not exists pitcher_game_stats (
  id               uuid primary key default gen_random_uuid(),
  game_id          uuid not null references games(id) on delete cascade,
  pitcher_id       uuid not null references players(id) on delete cascade,
  innings_pitched  numeric not null default 0,
  pitches_thrown   integer not null default 0,
  strikes          integer not null default 0,
  balls            integer not null default 0,
  hits_allowed     integer not null default 0,
  strikeouts       integer not null default 0,
  walks            integer not null default 0,
  earned_runs      integer not null default 0,
  created_at       timestamptz not null default now(),
  unique(game_id, pitcher_id)
);

-- Individual pitches (optional detail)
create table if not exists pitches (
  id          uuid primary key default gen_random_uuid(),
  at_bat_id   uuid not null references at_bats(id) on delete cascade,
  pitch_type  text, -- ball | strike | foul
  result      text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_players_team     on players(team_id);
create index if not exists idx_games_team       on games(team_id);
create index if not exists idx_at_bats_game     on at_bats(game_id);
create index if not exists idx_at_bats_batter   on at_bats(batter_id);
create index if not exists idx_def_plays_game   on defensive_plays(game_id);
create index if not exists idx_pgs_game         on player_game_stats(game_id);
create index if not exists idx_pgs_player       on player_game_stats(player_id);
create index if not exists idx_pitcher_game     on pitcher_game_stats(game_id);
create index if not exists idx_pitches_at_bat   on pitches(at_bat_id);

-- ============================================================
-- Row Level Security — users can only see their own data
-- ============================================================
alter table teams              enable row level security;
alter table players            enable row level security;
alter table games              enable row level security;
alter table at_bats            enable row level security;
alter table defensive_plays    enable row level security;
alter table player_game_stats  enable row level security;
alter table pitcher_game_stats enable row level security;
alter table pitches            enable row level security;

-- Teams: owned by user
create policy "teams: owner access" on teams
  for all using (auth.uid() = user_id);

-- Everything else: access via team ownership
create policy "players: owner access" on players
  for all using (
    exists (select 1 from teams where teams.id = players.team_id and teams.user_id = auth.uid())
  );

create policy "games: owner access" on games
  for all using (
    exists (select 1 from teams where teams.id = games.team_id and teams.user_id = auth.uid())
  );

create policy "at_bats: owner access" on at_bats
  for all using (
    exists (
      select 1 from games
      join teams on teams.id = games.team_id
      where games.id = at_bats.game_id and teams.user_id = auth.uid()
    )
  );

create policy "defensive_plays: owner access" on defensive_plays
  for all using (
    exists (
      select 1 from games
      join teams on teams.id = games.team_id
      where games.id = defensive_plays.game_id and teams.user_id = auth.uid()
    )
  );

create policy "player_game_stats: owner access" on player_game_stats
  for all using (
    exists (
      select 1 from games
      join teams on teams.id = games.team_id
      where games.id = player_game_stats.game_id and teams.user_id = auth.uid()
    )
  );

create policy "pitcher_game_stats: owner access" on pitcher_game_stats
  for all using (
    exists (
      select 1 from games
      join teams on teams.id = games.team_id
      where games.id = pitcher_game_stats.game_id and teams.user_id = auth.uid()
    )
  );

create policy "pitches: owner access" on pitches
  for all using (
    exists (
      select 1 from at_bats
      join games on games.id = at_bats.game_id
      join teams on teams.id = games.team_id
      where at_bats.id = pitches.at_bat_id and teams.user_id = auth.uid()
    )
  );

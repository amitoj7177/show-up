CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash    text NOT NULL UNIQUE,
  nickname      text NOT NULL,
  goal_text     text NOT NULL,
  short_goal    text,
  goal_type     text NOT NULL,
  check_in_time text NOT NULL,
  why           jsonb NOT NULL,
  status        text NOT NULL DEFAULT 'waiting',
  gentle_mascot boolean NOT NULL DEFAULT false,
  notice        text,
  is_demo       boolean NOT NULL DEFAULT false,
  waiting_since timestamptz NOT NULL DEFAULT now(),
  last_seen     timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pairs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a     uuid NOT NULL REFERENCES users(id),
  user_b     uuid NOT NULL REFERENCES users(id),
  started_on date NOT NULL,
  day_offset int  NOT NULL DEFAULT 0,
  is_demo    boolean NOT NULL DEFAULT false,
  ended_at   timestamptz,
  end_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id    uuid NOT NULL REFERENCES pairs(id),
  user_id    uuid NOT NULL REFERENCES users(id),
  day        date NOT NULL,
  status     text NOT NULL CHECK (status IN ('done', 'rough')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pair_id, user_id, day)
);

CREATE TABLE IF NOT EXISTS encouragements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id    uuid NOT NULL REFERENCES pairs(id),
  from_user  uuid NOT NULL REFERENCES users(id),
  day        date NOT NULL,
  message_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pair_id, from_user, day)
);

CREATE TABLE IF NOT EXISTS reports (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id    uuid NOT NULL REFERENCES pairs(id),
  reporter   uuid NOT NULL REFERENCES users(id),
  reason     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE checkins ADD COLUMN IF NOT EXISTS photo text;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS photo_note text;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

ALTER TABLE users ADD COLUMN IF NOT EXISTS why_it_matters text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS area text;

ALTER TABLE checkins ADD COLUMN IF NOT EXISTS seen_at timestamptz;

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar text NOT NULL DEFAULT 'h0-c0-s1-e0-o1-k0-a0';

CREATE TABLE IF NOT EXISTS groups (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  join_code      text NOT NULL UNIQUE,
  staff_key_hash text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id);

CREATE TABLE IF NOT EXISTS accounts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id    text NOT NULL UNIQUE,
  avatar     text NOT NULL DEFAULT 'h0-c0-s1-e0-o1-k0-a0',
  user_id    uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS photo text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS community text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS adult boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS health_links (
  account_id    uuid PRIMARY KEY REFERENCES accounts(id),
  refresh_token text NOT NULL,
  linked_at     timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS health_states (
  state      text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS fitbit_steps int;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS fitbit_workout text;

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS moves text;

ALTER TABLE checkins ADD COLUMN IF NOT EXISTS fitbit_active_minutes int;

CREATE TABLE IF NOT EXISTS team_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user   uuid NOT NULL REFERENCES users(id),
  to_user     uuid NOT NULL REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz,
  accepted    boolean
);
CREATE INDEX IF NOT EXISTS team_requests_to ON team_requests (to_user, answered_at);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code text UNIQUE;

CREATE TABLE IF NOT EXISTS fitbit_requests (
  account_id   uuid PRIMARY KEY REFERENCES accounts(id),
  google_email text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_waiting ON users (status, waiting_since);
CREATE INDEX IF NOT EXISTS checkins_pair ON checkins (pair_id, day);

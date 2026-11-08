-- The whole database: four tables. Run with `npm run db:setup`.
-- Safe to run more than once.

-- One row per person. There are no real names, emails or passwords.
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash    text NOT NULL UNIQUE,          -- scrambled version of the phone's secret
  nickname      text NOT NULL,                 -- made up by the app
  goal_text     text NOT NULL,                 -- only the owner ever sees this
  short_goal    text,                          -- safety-checked version the partner sees
  goal_type     text NOT NULL,
  check_in_time text NOT NULL,                 -- "HH:MM", Calgary time
  why           jsonb NOT NULL,                -- what the "Why?" panel shows
  status        text NOT NULL DEFAULT 'waiting', -- waiting | paired | inactive | left
  gentle_mascot boolean NOT NULL DEFAULT false,
  notice        text,                          -- e.g. "Your partner moved on."
  is_demo       boolean NOT NULL DEFAULT false,
  waiting_since timestamptz NOT NULL DEFAULT now(),
  last_seen     timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- One row per partnership. It is active while ended_at is empty.
CREATE TABLE IF NOT EXISTS pairs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a     uuid NOT NULL REFERENCES users(id),
  user_b     uuid NOT NULL REFERENCES users(id),
  started_on date NOT NULL,
  day_offset int  NOT NULL DEFAULT 0,          -- only demo pairs "skip to tomorrow"
  is_demo    boolean NOT NULL DEFAULT false,
  ended_at   timestamptz,
  end_reason text,                             -- left | reported | new_match
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One row per person per day, either 'done' or 'rough'. No row means silence.
CREATE TABLE IF NOT EXISTS checkins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id    uuid NOT NULL REFERENCES pairs(id),
  user_id    uuid NOT NULL REFERENCES users(id),
  day        date NOT NULL,
  status     text NOT NULL CHECK (status IN ('done', 'rough')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pair_id, user_id, day)
);

-- Pre-written messages sent between partners. Only the message's id is stored.
CREATE TABLE IF NOT EXISTS encouragements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id    uuid NOT NULL REFERENCES pairs(id),
  from_user  uuid NOT NULL REFERENCES users(id),
  day        date NOT NULL,
  message_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pair_id, from_user, day)             -- one message per person per day
);

-- Reports. Reporting also ends the pairing straight away.
CREATE TABLE IF NOT EXISTS reports (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id    uuid NOT NULL REFERENCES pairs(id),
  reporter   uuid NOT NULL REFERENCES users(id),
  reason     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Proof: an optional photo of the activity, what Gemini saw in it, and when your partner confirmed it.
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS photo text;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS photo_note text;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- Why the goal matters, and which part of Calgary someone is in, for matching nearby.
ALTER TABLE users ADD COLUMN IF NOT EXISTS why_it_matters text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS area text;

-- When your partner first saw your check-in, so you know a real person did.
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS seen_at timestamptz;

-- The customizable character, saved as a short code. Partners can see it.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar text NOT NULL DEFAULT 'h0-c0-s1-e0-o1-k0-a0';

-- A clinic or campus program. People join with its code and are only paired with each other.
-- Staff use a separate secret key to see anonymous totals. We only store a scrambled version of it.
CREATE TABLE IF NOT EXISTS groups (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  join_code      text NOT NULL UNIQUE,
  staff_key_hash text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id);

-- One row per person with a login. Auth0 keeps the email and password, and we keep neither.
CREATE TABLE IF NOT EXISTS accounts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id    text NOT NULL UNIQUE,                 -- Auth0's id for this person
  avatar     text NOT NULL DEFAULT 'h0-c0-s1-e0-o1-k0-a0',
  user_id    uuid REFERENCES users(id),            -- their current promise
  created_at timestamptz NOT NULL DEFAULT now()
);

-- A real profile: first name, an optional photo, Calgary community, and an 18+ confirmation.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS photo text;              -- small JPEG, checked by Gemini first
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS community text;          -- City of Calgary community code
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS adult boolean NOT NULL DEFAULT false;

-- Fitbit (through Google's Health API): one long-lived access token per person, and short-lived sign-in checks.
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

-- iPhone steps, sent by an Apple Shortcut to a private link. Only today's number is kept.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS phone_key_hash text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS phone_steps int;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS phone_steps_day date;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS phone_steps_at timestamptz;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS phone_steps int;

-- The Nearby board: "Ask to team up" requests, and invite links for someone you know.
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

-- People asking to be added as Fitbit testers. Deleted once they connect.
CREATE TABLE IF NOT EXISTS fitbit_requests (
  account_id   uuid PRIMARY KEY REFERENCES accounts(id),
  google_email text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now()
);

-- One row per logged-in device.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_waiting ON users (status, waiting_since);
CREATE INDEX IF NOT EXISTS checkins_pair ON checkins (pair_id, day);

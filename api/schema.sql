CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  brand_color TEXT NOT NULL,
  brand_logo_url TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'short_text', 'multiple_choice', 'rating'
  title TEXT NOT NULL,
  options TEXT, -- JSON array of strings for multiple choice
  order_index INTEGER NOT NULL,
  FOREIGN KEY(survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL,
  submitted_at INTEGER NOT NULL,
  FOREIGN KEY(survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY,
  response_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  value TEXT NOT NULL,
  FOREIGN KEY(response_id) REFERENCES responses(id) ON DELETE CASCADE,
  FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
);

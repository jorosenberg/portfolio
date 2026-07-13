-- D1 schema — replaces DynamoDB table `site_counters`
CREATE TABLE IF NOT EXISTS counters (
  counter_id TEXT PRIMARY KEY,
  visits     INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO counters (counter_id, visits) VALUES ('friend-counter', 0);

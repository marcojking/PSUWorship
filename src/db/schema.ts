/**
 * Database Schema Types
 * SQLite schema for VocalHarmony persistence
 */

// Session: A practice session containing multiple runs
export interface Session {
    id: string;               // UUID
    created_at: string;       // ISO timestamp
    updated_at: string;       // ISO timestamp
    total_runs: number;
    total_practice_time_ms: number;
    average_score: number;    // 0.0 to 100.0
}

// Run: A single practice attempt within a session
export interface Run {
    id: string;               // UUID
    session_id: string;       // FK to Session
    created_at: string;
    melody_seed: number;      // For reproducibility
    key: string;
    difficulty: 1 | 2 | 3;
    interval: number;         // Semitones
    interval_mode: 'fixed' | 'diatonic';
    length_in_notes: number;
    loop_mode: boolean;
    ghost_harmony: boolean;
    score: number;            // 0.0 to 100.0 (% time on target)
    duration_ms: number;
    notes_sequence_json: string;  // JSON array of note results
    per_note_stats_json: string;  // JSON object with per-note breakdown
}

// IntervalStats: Aggregated stats per interval for recommendations
export interface IntervalStats {
    id: string;
    interval: number;         // Semitones (e.g., 4 = major third)
    total_attempts: number;
    average_score: number;    // EMA-based
    last_attempt_at: string;
    struggling: boolean;      // True if score < threshold
}

// UserSettings: User preferences
export interface UserSettings {
    id: string;
    haptic_enabled: boolean;
    target_tolerance_cents: number;  // Default 50
    hold_threshold_ms: number;       // Default 300
    auto_difficulty: boolean;
    sync_enabled: boolean;           // For future cloud sync
}

// Schema version for migrations
export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  total_runs INTEGER DEFAULT 0,
  total_practice_time_ms INTEGER DEFAULT 0,
  average_score REAL DEFAULT 0.0
);

-- Runs table
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  melody_seed INTEGER NOT NULL,
  key TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  interval INTEGER NOT NULL,
  interval_mode TEXT NOT NULL,
  length_in_notes INTEGER NOT NULL,
  loop_mode INTEGER NOT NULL,
  ghost_harmony INTEGER NOT NULL,
  score REAL NOT NULL,
  duration_ms INTEGER NOT NULL,
  notes_sequence_json TEXT,
  per_note_stats_json TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Interval stats table
CREATE TABLE IF NOT EXISTS interval_stats (
  id TEXT PRIMARY KEY,
  interval INTEGER UNIQUE NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  average_score REAL DEFAULT 0.0,
  last_attempt_at TEXT,
  struggling INTEGER DEFAULT 0
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  haptic_enabled INTEGER DEFAULT 1,
  target_tolerance_cents INTEGER DEFAULT 50,
  hold_threshold_ms INTEGER DEFAULT 300,
  auto_difficulty INTEGER DEFAULT 0,
  sync_enabled INTEGER DEFAULT 0
);

-- Schema version table
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY
);

INSERT OR IGNORE INTO schema_version (version) VALUES (${SCHEMA_VERSION});
`;

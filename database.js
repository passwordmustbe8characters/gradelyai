/* eslint-disable no-undef */
import { createClient } from '@libsql/client'
import dotenv from 'dotenv'
dotenv.config()

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./data/gradely.db',
  authToken: process.env.TURSO_AUTH_TOKEN
})

// Initialize tables
await client.execute(`
  CREATE TABLE IF NOT EXISTS guides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    university TEXT NOT NULL,
    department TEXT NOT NULL,
    year TEXT,
    label TEXT NOT NULL,
    structure TEXT NOT NULL,
    writing_expectations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

await client.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    onboarded INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0,
    active_project_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)


try {
  await client.execute(`ALTER TABLE projects ADD COLUMN defense_prep TEXT`)
} catch {
await client.execute(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    university TEXT,
    department TEXT,
    project_type TEXT,
    status TEXT DEFAULT 'in_progress',
    is_paid INTEGER DEFAULT 0,
    chapters TEXT,
    abstract TEXT,
    refs TEXT,
    structure TEXT,
    project_info TEXT,
    flashcard_scores TEXT,
    defense_readiness INTEGER DEFAULT 0,
    defense_prep TEXT,
    corrections_history TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`)
}

try {
  await client.execute(`ALTER TABLE projects ADD COLUMN corrections_history TEXT`)
} catch {
  // column already exists
}

await client.execute(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    user_id INTEGER,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'success',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

await client.execute(`
  CREATE TABLE IF NOT EXISTS test_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    mode TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    got INTEGER DEFAULT 0,
    almost INTEGER DEFAULT 0,
    missed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  )
`)



export default client
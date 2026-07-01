import { execute } from "./db";

export async function ensureChatTables() {
  await execute(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      user1_id INTEGER NOT NULL REFERENCES users(id),
      user2_id INTEGER NOT NULL REFERENCES users(id),
      last_message TEXT,
      last_message_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id),
      sender_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT,
      attachment_url TEXT,
      attachment_type TEXT,
      reply_to_id INTEGER REFERENCES messages(id),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS typing_status (
      conversation_id INTEGER NOT NULL REFERENCES conversations(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      updated_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (conversation_id, user_id)
    )
  `);
}

export async function ensureCallTables() {
  await execute(`
    CREATE TABLE IF NOT EXISTS calls (
      id SERIAL PRIMARY KEY,
      caller_id INTEGER NOT NULL REFERENCES users(id),
      callee_id INTEGER NOT NULL REFERENCES users(id),
      status VARCHAR(20) DEFAULT 'ringing',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS call_signals (
      id SERIAL PRIMARY KEY,
      call_id INTEGER NOT NULL REFERENCES calls(id),
      sender_id INTEGER NOT NULL REFERENCES users(id),
      type VARCHAR(20) NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

export async function ensureServicesTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'Code2',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

export async function ensureSecurityTables() {
  await execute(`
    CREATE TABLE IF NOT EXISTS security_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      email VARCHAR(255),
      details TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await execute(`
    CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events (created_at DESC)
  `);
}

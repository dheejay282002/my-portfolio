import { Pool } from "pg";
import bcrypt from "bcryptjs";

let pool: Pool;

export function getDb(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/portfolio";
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
    });
    initDb().catch((err) => console.error("Database initialization failed:", err));
  }
  return pool;
}

export async function queryAll(sql: string, params: any[] = []) {
  const db = getDb();
  const res = await db.query(sql, params);
  return res.rows;
}

export async function queryOne(sql: string, params: any[] = []) {
  const db = getDb();
  const res = await db.query(sql, params);
  return res.rows[0] || null;
}

export async function execute(sql: string, params: any[] = []) {
  const db = getDb();
  return await db.query(sql, params);
}

async function initDb() {
  const db = pool;

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'client',
      last_name VARCHAR(255) DEFAULT '',
      profile_photo TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      github_url VARCHAR(255) DEFAULT '',
      linkedin_url VARCHAR(255) DEFAULT '',
      twitter_url VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      live_url VARCHAR(255) DEFAULT '',
      image_url VARCHAR(255) DEFAULT '',
      tech_stack VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      icon VARCHAR(50) DEFAULT 'Code2',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'Other',
      icon VARCHAR(50) DEFAULT 'Terminal',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      user1_id INTEGER NOT NULL REFERENCES users(id),
      user2_id INTEGER NOT NULL REFERENCES users(id),
      last_message TEXT DEFAULT '',
      last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      attachment_url TEXT DEFAULT '',
      attachment_type VARCHAR(100) DEFAULT '',
      reactions TEXT DEFAULT '{}',
      reply_to_id INTEGER DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS project_images (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS project_requests (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES users(id),
      project_name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      tech_stack VARCHAR(255) DEFAULT '',
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      conversation_id INTEGER REFERENCES conversations(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      project_request_id INTEGER UNIQUE NOT NULL REFERENCES project_requests(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS calls (
      id SERIAL PRIMARY KEY,
      caller_id INTEGER NOT NULL REFERENCES users(id),
      callee_id INTEGER NOT NULL REFERENCES users(id),
      status VARCHAR(50) NOT NULL DEFAULT 'ringing',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS call_signals (
      id SERIAL PRIMARY KEY,
      call_id INTEGER NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      type VARCHAR(50) NOT NULL,
      data TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS typing_status (
      conversation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (conversation_id, user_id)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS email_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      smtp_host VARCHAR(255) NOT NULL DEFAULT '',
      smtp_port INTEGER NOT NULL DEFAULT 587,
      smtp_user VARCHAR(255) NOT NULL DEFAULT '',
      smtp_password VARCHAR(255) NOT NULL DEFAULT '',
      sender_email VARCHAR(255) NOT NULL DEFAULT '',
      sender_name VARCHAR(255) NOT NULL DEFAULT '',
      provider VARCHAR(50) NOT NULL DEFAULT 'smtp',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS pending_otps (
      email VARCHAR(255) PRIMARY KEY,
      code VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    )
  `);

  const hasConfig = (await db.query("SELECT id FROM email_config WHERE id = 1")).rows[0];
  if (!hasConfig) {
    await db.query(`
      INSERT INTO email_config (id, smtp_host, smtp_port, smtp_user, smtp_password, sender_email, sender_name, provider)
      VALUES (1, 'smtp.gmail.com', 587, '', '', '', '', 'smtp')
      ON CONFLICT DO NOTHING
    `);
  }

  const adminRes = await db.query("SELECT id FROM users WHERE role = 'admin'");
  if (adminRes.rowCount === 0) {
    const hash = bcrypt.hashSync("admin123", 10);
    await db.query(`
      INSERT INTO users (name, email, password, role, github_url, linkedin_url, twitter_url) 
      VALUES ($1, $2, $3, 'admin', $4, $5, $6)
    `, [
      "Dee Jay",
      "admin@deejay.dev",
      hash,
      "https://github.com/deejay-cristobal",
      "https://linkedin.com/in/deejay-cristobal",
      "https://twitter.com/deejay_cristobal"
    ]);
  } else {
    try {
      await db.query(`
        UPDATE users 
        SET github_url = CASE WHEN github_url = '' OR github_url IS NULL THEN 'https://github.com/deejay-cristobal' ELSE github_url END,
            linkedin_url = CASE WHEN linkedin_url = '' OR linkedin_url IS NULL THEN 'https://linkedin.com/in/deejay-cristobal' ELSE linkedin_url END,
            twitter_url = CASE WHEN twitter_url = '' OR twitter_url IS NULL THEN 'https://twitter.com/deejay_cristobal' ELSE twitter_url END
        WHERE role = 'admin'
      `);
    } catch {}
  }
}

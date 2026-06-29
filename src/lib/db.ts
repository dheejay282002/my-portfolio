import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

const dbPath = path.join(process.cwd(), "data.db");

let db: Database.Database;

export function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.pragma("busy_timeout = 5000");
    db.pragma("journal_size_limit = 6144000");
    initDb();
  }
  return db;
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client' CHECK(role IN ('admin', 'client')),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      live_url TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      tech_stack TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT DEFAULT 'Code2',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Other',
      icon TEXT DEFAULT 'Terminal',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER NOT NULL,
      user2_id INTEGER NOT NULL,
      last_message TEXT DEFAULT '',
      last_message_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user1_id) REFERENCES users(id),
      FOREIGN KEY (user2_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS project_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS project_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      project_name TEXT NOT NULL,
      description TEXT NOT NULL,
      tech_stack TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','in_progress','testing','completed','delivered')),
      conversation_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES users(id),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    )
  `);

  // Add profile columns if missing
  try { db.exec("ALTER TABLE users ADD COLUMN last_name TEXT DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN profile_photo TEXT DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN github_url TEXT DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN linkedin_url TEXT DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN twitter_url TEXT DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE messages ADD COLUMN attachment_url TEXT DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE messages ADD COLUMN attachment_type TEXT DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE messages ADD COLUMN reactions TEXT DEFAULT '{}'"); } catch {}
  try { db.exec("ALTER TABLE messages ADD COLUMN reply_to_id INTEGER DEFAULT NULL"); } catch {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_request_id INTEGER UNIQUE NOT NULL,
      client_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_request_id) REFERENCES project_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      caller_id INTEGER NOT NULL,
      callee_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'ringing' CHECK(status IN ('ringing','active','ended','rejected','missed')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (caller_id) REFERENCES users(id),
      FOREIGN KEY (callee_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS call_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      call_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (call_id) REFERENCES calls(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS typing_status (
      conversation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (conversation_id, user_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS email_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      smtp_host TEXT NOT NULL DEFAULT '',
      smtp_port INTEGER NOT NULL DEFAULT 587,
      smtp_user TEXT NOT NULL DEFAULT '',
      smtp_password TEXT NOT NULL DEFAULT '',
      sender_email TEXT NOT NULL DEFAULT '',
      sender_name TEXT NOT NULL DEFAULT '',
      provider TEXT NOT NULL DEFAULT 'smtp',
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_otps (
      email TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    )
  `);

  const hasConfig = db.prepare("SELECT id FROM email_config WHERE id = 1").get();
  if (!hasConfig) {
    db.prepare(`
      INSERT INTO email_config (id, smtp_host, smtp_port, smtp_user, smtp_password, sender_email, sender_name, provider)
      VALUES (1, 'smtp.gmail.com', 587, '', '', '', '', 'smtp')
    `).run();
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE role = 'admin'")
    .get();
  if (!existing) {
    const hash = bcrypt.hashSync("admin123", 10);
    db.prepare(
      "INSERT INTO users (name, email, password, role, github_url, linkedin_url, twitter_url) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(
      "Dee Jay",
      "admin@deejay.dev",
      hash,
      "admin",
      "https://github.com/deejay-cristobal",
      "https://linkedin.com/in/deejay-cristobal",
      "https://twitter.com/deejay_cristobal"
    );
  } else {
    try {
      db.prepare(`
        UPDATE users 
        SET github_url = CASE WHEN github_url = '' OR github_url IS NULL THEN 'https://github.com/deejay-cristobal' ELSE github_url END,
            linkedin_url = CASE WHEN linkedin_url = '' OR linkedin_url IS NULL THEN 'https://linkedin.com/in/deejay-cristobal' ELSE linkedin_url END,
            twitter_url = CASE WHEN twitter_url = '' OR twitter_url IS NULL THEN 'https://twitter.com/deejay_cristobal' ELSE twitter_url END
        WHERE role = 'admin'
      `).run();
    } catch {}
  }
}

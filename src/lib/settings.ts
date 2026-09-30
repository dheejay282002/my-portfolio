import { execute, queryOne } from "./db";

export async function ensureSignupFlagColumn() {
  try {
    await execute(`
      ALTER TABLE web_settings ADD COLUMN IF NOT EXISTS signup_enabled BOOLEAN DEFAULT TRUE;
    `);
  } catch {}
}

export async function isSignupEnabled(): Promise<boolean> {
  await ensureSignupFlagColumn();
  try {
    const row = (await queryOne("SELECT signup_enabled FROM web_settings WHERE id = 1")) as { signup_enabled?: boolean | null } | null;
    if (!row) return true;
    return row.signup_enabled !== false;
  } catch {
    return true;
  }
}

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

export interface UserPayload {
  id: number;
  name: string;
  email: string;
  role: "admin" | "client";
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(user: UserPayload): string {
  return jwt.sign(user, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, SECRET) as UserPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

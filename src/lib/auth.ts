import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { query, getSessionSecret } from "@/lib/db/pool";
import type { Role, User } from "@/lib/types";

export const SESSION_COOKIE = "signal_session";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: Role;
};

function secretKey() {
  return new TextEncoder().encode(getSessionSecret());
}

export async function createSessionToken(user: User) {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function readSessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : "User",
      role: payload.role === "admin" ? "admin" : "member",
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await readSessionToken(token);
  if (!session) return null;

  const { rows } = await query<{
    id: string;
    name: string;
    email: string;
    role: Role;
  }>(`select id, name, email, role from profiles where id = $1`, [session.sub]);

  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

export function isAdmin(user: User | null | undefined) {
  return user?.role === "admin";
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Sign in required", 401);
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdmin(user)) throw new AuthError("Admins only", 403);
  return user;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!name || !email || input.password.length < 6) {
    throw new AuthError("Name, email, and a password (6+ chars) are required", 400);
  }

  const existing = await query(`select id from profiles where email = $1`, [
    email,
  ]);
  if (existing.rowCount) {
    throw new AuthError("An account with that email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const { rows } = await query<{
    id: string;
    name: string;
    email: string;
    role: Role;
  }>(
    `insert into profiles (name, email, role, password_hash)
     values ($1, $2, 'member', $3)
     returning id, name, email, role`,
    [name, email, passwordHash],
  );

  return rows[0];
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<User> {
  const { rows } = await query<{
    id: string;
    name: string;
    email: string;
    role: Role;
    password_hash: string | null;
  }>(
    `select id, name, email, role, password_hash from profiles where email = $1`,
    [email.trim().toLowerCase()],
  );
  const row = rows[0];
  if (!row?.password_hash) {
    throw new AuthError("Invalid email or password", 401);
  }
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) throw new AuthError("Invalid email or password", 401);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

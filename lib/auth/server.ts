import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { isSessionUser, type SessionUser } from "./types";

export const SESSION_COOKIE = "wu_session";
export const SESSION_SECONDS = 60 * 60 * 8;
export const REMEMBER_SECONDS = 60 * 60 * 24 * 7;
type Account = SessionUser & { passwordHash: string };

// Development-only fixtures. Never use these accounts in production.
const demoUsers: SessionUser[] = [
  { id: "demo-admin", username: "admin", name: "ผู้ดูแลระบบทดสอบ", role: "admin" },
  { id: "641123456", username: "student", name: "นายกานต์ ชนสิริ", role: "student" },
  { id: "demo-coordinator", username: "coordinator", name: "ผู้ประสานงานทดสอบ", role: "coordinator" },
  { id: "demo-advisor", username: "advisor", name: "ศ.ดร. นลินทิพย์ กิตติสิริ", role: "advisor" },
];
const globalAuth = globalThis as typeof globalThis & { wuDevSecret?: string };

function isAccount(value: unknown): value is Account {
  return isSessionUser(value)
    && typeof (value as Record<string, unknown>).passwordHash === "string"
    && /^[a-f0-9]{32}:[a-f0-9]{128}$/.test((value as Record<string, string>).passwordHash);
}

function secret() {
  const configured = process.env.AUTH_SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV !== "development") throw new Error("Configure AUTH_SESSION_SECRET");
  return globalAuth.wuDevSecret ??= randomBytes(32).toString("hex");
}

function accounts(): Account[] {
  if (process.env.AUTH_USERS_JSON) {
    const parsed: unknown = JSON.parse(process.env.AUTH_USERS_JSON);
    if (!Array.isArray(parsed) || !parsed.every(isAccount)) throw new Error("Invalid AUTH_USERS_JSON");
    return parsed;
  }
  if (process.env.NODE_ENV !== "development") throw new Error("Configure an account provider");
  const salt = "77652d696e7465726e736869702d646576";
  const passwordHash = `${salt}:${scryptSync("Demo123!", salt, 64).toString("hex")}`;
  return demoUsers.map(user => ({ ...user, passwordHash }));
}

function publicUser(account: Account): SessionUser {
  return { id: account.id, username: account.username, name: account.name, role: account.role };
}

export function authenticate(username: string, password: string): SessionUser | null {
  const account = accounts().find(user => user.username === username || (user.role === "student" && user.id === username));
  const [salt, hash] = (account?.passwordHash ?? `${"0".repeat(32)}:${"0".repeat(128)}`).split(":");
  const matches = timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, "hex"));
  return account && matches ? publicUser(account) : null;
}

export function createSession(user: SessionUser, duration: number): string {
  const payload = Buffer.from(JSON.stringify({ id: user.id, expires: Date.now() + duration * 1000 })).toString("base64url");
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("base64url")}`;
}

export function readSession(token?: string): SessionUser | null {
  if (!token || token.length > 4096) return null;
  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return null;
    const expected = createHmac("sha256", secret()).update(payload).digest();
    const received = Buffer.from(signature, "base64url");
    if (received.length !== expected.length || !timingSafeEqual(expected, received)) return null;
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof value.id !== "string" || typeof value.expires !== "number" || value.expires <= Date.now()) return null;
    const account = accounts().find(user => user.id === value.id);
    return account ? publicUser(account) : null;
  } catch { return null; }
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin;
}

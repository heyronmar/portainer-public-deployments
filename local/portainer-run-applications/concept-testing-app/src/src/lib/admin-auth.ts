// Researcher sign-in. A signed, expiring cookie instead of a server-side session table:
// the value is `<expiry>.<hmac>` keyed by ADMIN_USER + ADMIN_PASSWORD, so changing the password signs everyone out.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "ct_admin";
export const ADMIN_MAX_AGE = 60 * 60 * 12; // 12 hours

const sha = (s: string) => createHash("sha256").update(s).digest();
const same = (a: string, b: string) => timingSafeEqual(sha(a), sha(b));

function creds() {
  const user = process.env.ADMIN_USER, pass = process.env.ADMIN_PASSWORD;
  return user && pass ? { user, pass } : null;
}

export const adminEnabled = () => creds() !== null;

/** Compares both parts every time so timing doesn't reveal which one was wrong. */
export function checkCredentials(user: string, pass: string): boolean {
  const c = creds();
  if (!c) return false;
  const userOk = same(user, c.user), passOk = same(pass, c.pass);
  return userOk && passOk;
}

const sign = (exp: string, c: { user: string; pass: string }) =>
  createHmac("sha256", `${c.user}:${c.pass}`).update(`admin-session:${exp}`).digest("base64url");

export function createSessionToken(): string {
  const c = creds();
  if (!c) throw new Error("ADMIN_USER and ADMIN_PASSWORD are not set");
  const exp = String(Math.floor(Date.now() / 1000) + ADMIN_MAX_AGE);
  return `${exp}.${sign(exp, c)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  const c = creds();
  if (!c || !token) return false;
  const [exp, mac] = token.split(".");
  if (!exp || !mac || !/^\d+$/.test(exp) || Number(exp) * 1000 < Date.now()) return false;
  return same(mac, sign(exp, c));
}

/** Scripts (curl, CSV pulls) can still send HTTP basic auth instead of signing in. */
export function verifyBasicAuth(header: string | null): boolean {
  if (!header?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const i = decoded.indexOf(":");
  return i >= 0 && checkCredentials(decoded.slice(0, i), decoded.slice(i + 1));
}

/** Only same-site /admin paths, so the sign-in page can't be used to bounce people elsewhere. */
export function safeNext(next: unknown): string {
  return typeof next === "string" && /^\/admin(?:[/?#]|$)/.test(next) && !next.startsWith("/admin/login") ? next : "/admin";
}

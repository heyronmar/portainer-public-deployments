// Server-side email check: the shared rules plus a DNS lookup, so made-up domains (asdfgh.com) are caught too.
import { resolve4, resolve6, resolveMx } from "node:dns/promises";
import { isDisposableDomain } from "./disposable-domains";
import { emailProblem } from "./survey";

const THROWAWAY = "That looks like a test or throwaway email domain. Please use your real email so we can send your swag.";
const NO_DOMAIN = "We couldn't find that email domain. Check for typos, or use another email address.";
const DNS_TIMEOUT_MS = 3000;

/** True if the domain can receive mail (MX record, or an address record as the RFC 5321 fallback). */
async function domainReceivesMail(domain: string): Promise<boolean> {
  const has = (p: Promise<unknown[]>) => p.then((r) => r.length > 0, (e: NodeJS.ErrnoException) => {
    if (e.code === "ENOTFOUND" || e.code === "ENODATA" || e.code === "ESERVFAIL") return false;
    throw e;
  });
  const mx = await resolveMx(domain).catch((e: NodeJS.ErrnoException) => {
    if (e.code === "ENOTFOUND" || e.code === "ENODATA" || e.code === "ESERVFAIL") return [];
    throw e;
  });
  // A "null MX" (RFC 7505: a single record pointing at ".") means the domain says it accepts no email.
  if (mx.length) return mx.some((r) => r.exchange !== "" && r.exchange !== ".");
  return (await has(resolve4(domain))) || (await has(resolve6(domain)));
}

/** Why the server won't accept this email, or null. A DNS outage or slow lookup lets the email through. */
export async function serverEmailProblem(email: string): Promise<string | null> {
  const problem = emailProblem(email);
  if (problem) return problem;
  const domain = email.trim().toLowerCase().split("@").pop()!;
  if (isDisposableDomain(domain)) return THROWAWAY;
  const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(true), DNS_TIMEOUT_MS));
  const ok = await Promise.race([domainReceivesMail(domain).catch(() => true), timeout]);
  return ok ? null : NO_DOMAIN;
}

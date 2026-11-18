"use server";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE, ADMIN_MAX_AGE, adminEnabled, checkCredentials, createSessionToken, safeNext, verifyBasicAuth, verifySessionToken,
} from "@/lib/admin-auth";
import { deleteResponse } from "@/lib/db";

/** Server actions can be posted to any URL, so the /admin proxy check isn't enough on its own. */
async function isAdmin() {
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value) || verifyBasicAuth((await headers()).get("authorization"));
}

export async function deleteParticipant(id: string): Promise<{ error?: string }> {
  if (!(await isAdmin())) return { error: "Your session has expired. Sign in again to delete records." }; // same text as EXPIRED in participant-row
  if (!deleteResponse(id)) return { error: "That record was already deleted." };
  revalidatePath("/admin");
  return {};
}

export type SignInState = { error?: string; user?: string };

export async function signIn(_prev: SignInState, form: FormData): Promise<SignInState> {
  const user = String(form.get("user") ?? "").trim(), pass = String(form.get("password") ?? "");
  if (!adminEnabled()) return { error: "The researcher view is turned off on this server.", user };
  if (!user || !pass) return { error: "Enter your username and password.", user };
  if (!checkCredentials(user, pass)) {
    // A short pause makes guessing passwords slow.
    await new Promise((r) => setTimeout(r, 800));
    return { error: "That username and password don't match. Check them and try again.", user };
  }
  const host = (await headers()).get("host") ?? "";
  (await cookies()).set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    // Public domains are https (Cloudflare reports http for its hop, so don't trust the request scheme).
    secure: !/^(localhost|127\.0\.0\.1)(:|$)/.test(host),
    path: "/admin",
    maxAge: ADMIN_MAX_AGE,
  });
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin/login");
}

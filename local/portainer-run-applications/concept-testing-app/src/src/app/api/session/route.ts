import { NextResponse, type NextRequest } from "next/server";
import { createResponse, getResponse, saveResponse } from "@/lib/db";
import { COOKIE, setIdCookie } from "@/lib/session";
import { DONE_STEP, STEP_COUNT, sanitize, validateStep } from "@/lib/survey";

const demoUrl = () => process.env.DEMO_URL || "https://portainer-laptop.heyronmar.com";
/** Sign-in shown on the demo step. Hidden unless both are set. */
const demoLogin = () => {
  const user = process.env.DEMO_USER, password = process.env.DEMO_PASSWORD;
  return user && password ? { user, password } : null;
};

/** Resume the participant from their cookie, or start a new response. */
export async function POST(req: NextRequest) {
  const existing = getResponse(req.cookies.get(COOKIE)?.value ?? "");
  const row = existing ?? createResponse();
  const res = NextResponse.json({ id: row.id, state: row.state, demoUrl: demoUrl(), demoLogin: demoLogin(), created: !existing });
  setIdCookie(req, res, row.id);
  return res;
}

/** Save progress. `submit: true` validates every step server-side and marks the response submitted. */
export async function PUT(req: NextRequest) {
  const row = getResponse(req.cookies.get(COOKIE)?.value ?? "");
  if (!row) return NextResponse.json({ error: "No session. Reload the page to start again." }, { status: 401 });
  if (Number(req.headers.get("content-length") ?? 0) > 256_000) return NextResponse.json({ error: "Too large" }, { status: 413 });

  let body: { state?: unknown; submit?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const next = sanitize(body.state);
  // Server-owned fields: never taken from the client.
  next.startedAt = row.state.startedAt;
  next.submittedAt = row.state.submittedAt;

  if (body.submit) {
    for (let i = 0; i < STEP_COUNT; i++) {
      const errors = validateStep(next, i);
      if (Object.keys(errors).length) return NextResponse.json({ error: "Some answers are missing.", step: i, errors }, { status: 422 });
    }
    next.submittedAt ??= new Date().toISOString();
    next.completed = Array.from({ length: STEP_COUNT }, (_, i) => i);
    next.step = DONE_STEP;
  } else if (next.step === DONE_STEP && !next.submittedAt) {
    next.step = STEP_COUNT - 1;
  }

  const saved = saveResponse(row.id, next);
  return NextResponse.json({ state: saved.state });
}

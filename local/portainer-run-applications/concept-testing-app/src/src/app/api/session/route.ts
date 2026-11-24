import { NextResponse, type NextRequest } from "next/server";
import { createResponse, deleteResponse, findByEmail, getResponse, saveResponse } from "@/lib/db";
import { serverEmailProblem } from "@/lib/email-check";
import { COOKIE, setIdCookie } from "@/lib/session";
import { DONE_STEP, STEP_COUNT, sanitize, validateStep } from "@/lib/survey";

const TAKEN_SUBMIT = "This email has already been used to submit the study, so it can't be used again.";

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

  // Check the email when they leave the intro and again on submit, so dummy addresses can't skip the form's check.
  // One response per email: starting with an email on file reopens that response; a submit can't reuse an already-submitted email.
  const starting = next.introDone && !row.state.introDone;
  if (starting || body.submit) {
    const problem = (await serverEmailProblem(next.a.swag.email))
      || (!starting && findByEmail(next.a.swag.email, row.id, { submittedOnly: true }) && TAKEN_SUBMIT);
    if (problem) {
      return NextResponse.json({ error: problem, step: starting ? -1 : STEP_COUNT - 1, errors: { "swag.email": problem } }, { status: 422 });
    }
    const earlier = starting ? findByEmail(next.a.swag.email, row.id) : null;
    if (earlier) {
      // This row only holds the email just typed, so drop it and point the browser at the earlier one.
      deleteResponse(row.id);
      const res = NextResponse.json({ id: earlier.id, state: earlier.state, resumed: true });
      setIdCookie(req, res, earlier.id);
      return res;
    }
  }

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

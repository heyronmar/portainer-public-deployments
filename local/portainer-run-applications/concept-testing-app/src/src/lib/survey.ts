// Shared survey model: copy, option lists, the answers shape and validation.
// Used by the participant UI, the API (server-side sanitising + submit checks) and the admin view.

export const POS = ["Intuitive", "Clean", "Efficient", "Fast", "Organized", "Powerful", "Reliable", "Easy to use", "Modern", "Consistent", "Clear", "Flexible", "Polished", "Time-saving", "Trustworthy", "Approachable"];
export const NEG = ["Cluttered", "Confusing", "Overwhelming", "Slow", "Outdated", "Complex", "Inconsistent", "Frustrating", "Hard to navigate", "Busy", "Rigid", "Tedious", "Hidden", "Too technical", "Fragmented", "Dense"];
export const PICK_MIN = 1;
export const PICK_MAX = 3;

export const ROLES = ["Platform / DevOps engineer", "Developer", "SRE / Ops", "IT administrator", "Engineering manager", "Homelab / hobbyist", "Other"];
export const USAGE = ["Less than 6 months", "6–12 months", "1–3 years", "3+ years"];
export const EDITIONS = ["Community Edition", "Business Edition", "Both", "Not sure"];
export const FREQUENCY = ["Daily", "Weekly", "Monthly", "Rarely"];
export const TASKS = ["Look around the home dashboard", "Find and open an environment", "Find a running container or workload", "Try deploying or editing something", "Look for settings or user management"];
export const PREFERENCES = ["Current Portainer", "Portainer V3", "No preference"];
export const FOLLOW_UP = ["Yes, happy to chat", "No thanks"];
export const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

export const STEPS = [
  { key: "current", title: "Current Portainer", sub: "How it feels today", mins: 3 },
  { key: "wordsBefore", title: "Pick words", sub: "Current UI", mins: 2 },
  { key: "demo", title: "Explore V3", sub: "Open the demo", mins: 10 },
  { key: "wordsAfter", title: "Pick words", sub: "V3 UI", mins: 2 },
  { key: "final", title: "Final thoughts", sub: "Anything else", mins: 2 },
  { key: "swag", title: "Claim your swag", sub: "Shipping details", mins: 1 },
] as const;
export const STEP_COUNT = STEPS.length;
export const DONE_STEP = STEP_COUNT; // step index of the thank-you screen

export type WordKey = "wordsBefore" | "wordsAfter";
export type WordPicks = { pos: string[]; neg: string[]; why: Record<string, string> };
export type Swag = { name: string; email: string; company: string; address: string; city: string; postcode: string; country: string; size: string; consent: boolean };
export type Answers = {
  role: string; usage: string; edition: string; frequency: string;
  satisfaction: number | null; ease: number | null; likes: string; frustrations: string;
  wordsBefore: WordPicks;
  demoTasks: string[]; demoNotes: string;
  wordsAfter: WordPicks;
  preference: string; nps: number | null; finalNotes: string; followUp: string;
  swag: Swag;
};
export type State = {
  step: number; completed: number[]; openedDemo: boolean;
  /** Passed the intro screen (email entered). */
  introDone: boolean;
  startedAt: string; submittedAt: string | null; updatedAt?: string;
  a: Answers;
};

export const blank = (): State => ({
  step: 0, completed: [], openedDemo: false, introDone: false, startedAt: new Date().toISOString(), submittedAt: null,
  a: {
    role: "", usage: "", edition: "", frequency: "", satisfaction: null, ease: null, likes: "", frustrations: "",
    wordsBefore: { pos: [], neg: [], why: {} },
    demoTasks: [], demoNotes: "",
    wordsAfter: { pos: [], neg: [], why: {} },
    preference: "", nps: null, finalNotes: "", followUp: "",
    swag: { name: "", email: "", company: "", address: "", city: "", postcode: "", country: "", size: "", consent: false },
  },
});

/* ---------- sanitising (untrusted JSON -> State) ---------- */

const TEXT_MAX = 5000;
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const str = (v: unknown, max = TEXT_MAX) => (typeof v === "string" ? v.slice(0, max) : "");
const oneOf = (v: unknown, opts: readonly string[]) => (typeof v === "string" && opts.includes(v) ? v : "");
const intIn = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi ? v : null);
const pick = (v: unknown, opts: readonly string[], max = Infinity) =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string" && opts.includes(x)))].slice(0, max) : [];

function words(v: unknown): WordPicks {
  const w = obj(v), whyIn = obj(w.why);
  const pos = pick(w.pos, POS, PICK_MAX), neg = pick(w.neg, NEG, PICK_MAX);
  const why: Record<string, string> = {};
  for (const x of [...POS, ...NEG]) if (typeof whyIn[x] === "string") why[x] = str(whyIn[x]);
  return { pos, neg, why };
}

/** Coerce anything into a well-formed State. Unknown keys and out-of-range values are dropped. */
export function sanitize(input: unknown): State {
  const s = obj(input), a = obj(s.a), sw = obj(a.swag), b = blank();
  return {
    step: intIn(s.step, 0, DONE_STEP) ?? 0,
    completed: Array.isArray(s.completed) ? [...new Set(s.completed.filter((i): i is number => intIn(i, 0, STEP_COUNT - 1) !== null))].sort() : [],
    openedDemo: s.openedDemo === true,
    introDone: s.introDone === true,
    startedAt: str(s.startedAt, 40) || b.startedAt,
    submittedAt: str(s.submittedAt, 40) || null,
    updatedAt: str(s.updatedAt, 40) || undefined,
    a: {
      role: oneOf(a.role, ROLES), usage: oneOf(a.usage, USAGE), edition: oneOf(a.edition, EDITIONS), frequency: oneOf(a.frequency, FREQUENCY),
      satisfaction: intIn(a.satisfaction, 1, 5), ease: intIn(a.ease, 1, 7), likes: str(a.likes), frustrations: str(a.frustrations),
      wordsBefore: words(a.wordsBefore),
      demoTasks: pick(a.demoTasks, TASKS), demoNotes: str(a.demoNotes),
      wordsAfter: words(a.wordsAfter),
      preference: oneOf(a.preference, PREFERENCES), nps: intIn(a.nps, 0, 10), finalNotes: str(a.finalNotes), followUp: oneOf(a.followUp, FOLLOW_UP),
      swag: {
        name: str(sw.name, 200), email: str(sw.email, 200), company: str(sw.company, 200), address: str(sw.address, 500),
        city: str(sw.city, 200), postcode: str(sw.postcode, 40), country: str(sw.country, 200), size: oneOf(sw.size, SIZES), consent: sw.consent === true,
      },
    },
  };
}

/* ---------- validation ---------- */

/** Field key -> message. Empty object means the step is valid. */
export type Errors = Record<string, string>;
const REQUIRED = "This question is required.";
const EMAIL = /^\S+@\S+\.\S+$/;

/** The intro asks for an email first. It is stored as the swag email, so step 6 starts prefilled. */
export function validateIntro(s: State): Errors {
  const email = s.a.swag.email.trim();
  if (!email) return { "swag.email": "Enter your email address." };
  return EMAIL.test(email) ? {} : { "swag.email": "That email address doesn't look right. Check for typos." };
}

function validCurrent(s: State): Errors {
  const a = s.a, e: Errors = {};
  if (!a.role) e.role = "Select your role.";
  if (!a.usage) e.usage = "Select how long you've used Portainer.";
  if (!a.satisfaction) e.satisfaction = REQUIRED;
  if (!a.ease) e.ease = REQUIRED;
  if (!a.frustrations.trim()) e.frustrations = "Tell us what frustrates you most.";
  return e;
}

function validWords(s: State, which: WordKey): Errors {
  const w = s.a[which], e: Errors = {};
  if (w.pos.length < PICK_MIN) e[`${which}.pos`] = "Pick at least one positive word.";
  if (w.neg.length < PICK_MIN) e[`${which}.neg`] = "Pick at least one negative word.";
  for (const x of [...w.pos, ...w.neg]) if (!(w.why[x] || "").trim()) e[`${which}.why.${x}`] = "Add a short reason for this word.";
  return e;
}

function validDemo(s: State): Errors {
  return s.openedDemo ? {} : { openedDemo: "Open the demo first. It opens in a new tab so you won't lose your place." };
}

function validFinal(s: State): Errors {
  const e: Errors = {};
  if (!s.a.preference) e.preference = REQUIRED;
  if (s.a.nps === null) e.nps = REQUIRED;
  return e;
}

export const SWAG_REQUIRED = ["name", "email", "address", "city", "postcode", "country"] as const;
function validSwag(s: State): Errors {
  const sw = s.a.swag, e: Errors = {};
  for (const k of SWAG_REQUIRED) if (!sw[k].trim()) e[`swag.${k}`] = "This field is required.";
  if (!e["swag.email"] && !EMAIL.test(sw.email.trim())) e["swag.email"] = "That email address doesn't look right. Check for typos.";
  if (!sw.size) e["swag.size"] = "Pick a t-shirt size.";
  if (!sw.consent) e["swag.consent"] = "Please tick the consent box so we can ship your swag.";
  return e;
}

export function validateStep(s: State, step: number): Errors {
  switch (step) {
    case 0: return validCurrent(s);
    case 1: return validWords(s, "wordsBefore");
    case 2: return validDemo(s);
    case 3: return validWords(s, "wordsAfter");
    case 4: return validFinal(s);
    case 5: return validSwag(s);
    default: return {};
  }
}

export const isDone = (s: State, i: number) => s.completed.includes(i);
export const isUnlocked = (s: State, i: number) => i === 0 || isDone(s, i - 1) || isDone(s, i) || i <= s.step;

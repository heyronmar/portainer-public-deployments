// Shared survey model: copy, option lists, the answers shape and validation.
// Used by the participant UI, the API (server-side sanitising + submit checks) and the admin view.

export const POS = ["Intuitive", "Clean", "Efficient", "Fast", "Organized", "Powerful", "Reliable", "Easy to use", "Modern", "Consistent", "Clear", "Flexible", "Polished", "Time-saving", "Trustworthy", "Approachable"];
export const NEG = ["Cluttered", "Confusing", "Overwhelming", "Slow", "Outdated", "Complex", "Inconsistent", "Frustrating", "Hard to navigate", "Busy", "Rigid", "Tedious", "Hidden", "Too technical", "Fragmented", "Dense"];
export const PICK_MIN = 2;
export const PICK_MAX = 3;

export const ROLE_OTHER = "Other (please specify)";
export const ROLES = [
  "Platform / DevOps Engineer", "Developer", "SRE / Ops", "IT/Systems Administrator", "Solutions or Enterprise Architect",
  "Security / Compliance", "OT / Industrial / Edge Engineer", "Engineering or IT Manager", ROLE_OTHER,
];
// Answers saved under the earlier role list, so existing responses keep their role.
const LEGACY_ROLES: Record<string, { role: string; other?: string }> = {
  "Platform / DevOps engineer": { role: "Platform / DevOps Engineer" },
  "IT administrator": { role: "IT/Systems Administrator" },
  "Engineering manager": { role: "Engineering or IT Manager" },
  "Homelab / hobbyist": { role: ROLE_OTHER, other: "Homelab / hobbyist" },
  Other: { role: ROLE_OTHER },
};
/** The role as researchers should read it: the typed-in text when they picked Other. */
export const roleLabel = (a: { role: string; roleOther: string }) => (a.role === ROLE_OTHER ? a.roleOther.trim() || "Other" : a.role);
export const USAGE = ["Less than 6 months", "6–12 months", "1–3 years", "3+ years"];
export const FREQUENCY = ["Daily", "Weekly", "Monthly", "Rarely"];
export const TASKS = [
  "Look around the home dashboard", "Find and open an environment", "Find a running container or workload", "Look for settings or user management",
  // New UI components to look at
  "Sort and filter a table", "Open your account preferences", "Switch between light and dark mode",
  "Move between sections using the sidebar", "Open a details page and its tabs", "Check the status badges and icons",
];
export const PREFERENCES = ["Current Portainer UI", "Portainer new UI", "No preference"];
/** Earlier labels for the same choices, so saved answers still match. */
const LEGACY_PREFERENCES: Record<string, string> = {
  "Current Portainer": PREFERENCES[0], "Portainer V3": PREFERENCES[1], "Portainer-Ops V3UI": PREFERENCES[1], "Portainer-Ops new UI": PREFERENCES[1],
};
export const FOLLOW_UP = ["Yes, happy to chat", "No thanks"];
export const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
export const TOOLS_MAX = 20;
export const TOOL_LEN = 40;

export const STEPS = [
  { key: "current", title: "Current Portainer", sub: "How it feels today", mins: 3 },
  { key: "wordsBefore", title: "Pick words", sub: "Current UI", mins: 2 },
  { key: "demo", title: "Explore the new UI", sub: "Open the demo", mins: 10 },
  { key: "wordsAfter", title: "Pick words", sub: "Portainer UI", mins: 2 },
  { key: "final", title: "Final thoughts", sub: "Anything else", mins: 2 },
  { key: "swag", title: "Claim your hoodie", sub: "Shipping details", mins: 1 },
] as const;
export const STEP_COUNT = STEPS.length;
export const DONE_STEP = STEP_COUNT; // step index of the thank-you screen

export type WordKey = "wordsBefore" | "wordsAfter";
export type WordPicks = { pos: string[]; neg: string[]; why: Record<string, string> };
export type Swag = { name: string; email: string; company: string; address: string; city: string; postcode: string; country: string; size: string; consent: boolean };
export type Answers = {
  role: string;
  /** Filled in when role is ROLE_OTHER. */
  roleOther: string;
  usage: string; frequency: string;
  /** Other tools they use alongside Portainer, free-text tags. */
  tools: string[];
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
    role: "", roleOther: "", usage: "", frequency: "", tools: [], satisfaction: null, ease: null, likes: "", frustrations: "",
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

/** Free-text tags: trimmed, capped, de-duplicated ignoring case. */
export function tags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>(), out: string[] = [];
  for (const x of v) {
    const t = typeof x === "string" ? x.trim().slice(0, TOOL_LEN) : "";
    if (t && !seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); out.push(t); }
  }
  return out.slice(0, TOOLS_MAX);
}

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
  const legacy = typeof a.role === "string" ? LEGACY_ROLES[a.role] : undefined;
  const role = legacy?.role ?? oneOf(a.role, ROLES);
  return {
    step: intIn(s.step, 0, DONE_STEP) ?? 0,
    completed: Array.isArray(s.completed) ? [...new Set(s.completed.filter((i): i is number => intIn(i, 0, STEP_COUNT - 1) !== null))].sort() : [],
    openedDemo: s.openedDemo === true,
    introDone: s.introDone === true,
    startedAt: str(s.startedAt, 40) || b.startedAt,
    submittedAt: str(s.submittedAt, 40) || null,
    updatedAt: str(s.updatedAt, 40) || undefined,
    a: {
      role, roleOther: role === ROLE_OTHER ? str(a.roleOther, 200) || legacy?.other || "" : "", usage: oneOf(a.usage, USAGE), frequency: oneOf(a.frequency, FREQUENCY), tools: tags(a.tools),
      satisfaction: intIn(a.satisfaction, 1, 5), ease: intIn(a.ease, 1, 7), likes: str(a.likes), frustrations: str(a.frustrations),
      wordsBefore: words(a.wordsBefore),
      demoTasks: pick(a.demoTasks, TASKS), demoNotes: str(a.demoNotes),
      wordsAfter: words(a.wordsAfter),
      preference: oneOf(LEGACY_PREFERENCES[String(a.preference)] ?? a.preference, PREFERENCES), nps: intIn(a.nps, 0, 10), finalNotes: str(a.finalNotes), followUp: oneOf(a.followUp, FOLLOW_UP),
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

// Throwaway inboxes and placeholder domains. Swag is shipped to this address, so it has to be a real one.
const DUMMY_DOMAINS = new Set(`
  example.com example.org example.net example.edu test.com test.org test.net testing.com tester.com
  domain.com yourdomain.com mydomain.com company.com yourcompany.com website.com email.test sample.com
  fake.com fakeemail.com fakemail.com fakemail.net dummy.com dummymail.com nomail.com noemail.com none.com
  null.com abc.com xyz.com asdf.com qwerty.com foo.com bar.com foobar.com blah.com aaa.com placeholder.com
  mailinator.com mailinator.net mailinator2.com guerrillamail.com guerrillamail.net guerrillamail.org
  guerrillamailblock.com sharklasers.com grr.la pokemail.net spam4.me 10minutemail.com 10minutemail.net
  20minutemail.com temp-mail.org temp-mail.io tempmail.com tempmail.net tempmail.dev tempmailo.com
  tempinbox.com tempr.email tmpmail.org tmpmail.net mytemp.email throwawaymail.com yopmail.com yopmail.net
  yopmail.fr trashmail.com trashmail.net trashmail.de getnada.com nada.email dispostable.com maildrop.cc maildrop.com
  mailnesia.com mailcatch.com fakeinbox.com mintemail.com mohmal.com emailondeck.com discard.email
  moakt.com burnermail.io spamgourmet.com inboxkitten.com emailfake.com getairmail.com mailpoof.com
  33mail.com anonaddy.me mailsac.com harakirimail.com spambox.us trash-mail.com wegwerfmail.de
`.split(/\s+/).filter(Boolean));
// Reserved for testing and never deliverable on the public internet.
const DUMMY_TLDS = ["test", "example", "invalid", "localhost", "local", "lan", "internal"];
// Local parts that are obviously made up.
const DUMMY_LOCAL = /^(?:test(?:ing|er)?\d*|fake\d*|dummy\d*|sample\d*|example\d*|demo\d*|asdf\w*|qwert\w*|abc\d*|xyz\d*|foo(?:bar)?\d*|bar\d*|null|none|nobody|no-?reply|do-?not-?reply|spam\d*|junk\d*|temp\d*|user\d*|email\d*|mail\d*|name|your-?name|someone|anonymous|\d+|(.)\1{2,})$/;

/** Why an email can't be used, or null if it's fine. Shared by the browser and the server. */
export function emailProblem(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email) return "Enter your email address.";
  if (!EMAIL.test(email)) return "That email address doesn't look right. Check for typos.";
  const [local, domain] = [email.slice(0, email.lastIndexOf("@")), email.slice(email.lastIndexOf("@") + 1)];
  if (local.includes("+")) return "Please use your email address without a + alias, for example name@company.com.";
  const tld = domain.slice(domain.lastIndexOf(".") + 1);
  if (DUMMY_DOMAINS.has(domain) || [...DUMMY_DOMAINS].some((d) => domain.endsWith(`.${d}`)) || DUMMY_TLDS.includes(tld))
    return "That looks like a test or throwaway email domain. Please use your real email so we can send your hoodie.";
  if (DUMMY_LOCAL.test(local.replace(/[._+]/g, "")))
    return "That looks like a placeholder address. Please use your real email so we can send your hoodie.";
  return null;
}

/** One key per mailbox (case, +tags and Gmail dots ignored), for the one-response-per-email check. */
export function emailKey(raw: string): string {
  const email = raw.trim().toLowerCase(), at = email.lastIndexOf("@");
  if (at < 0) return email;
  let local = email.slice(0, at).split("+")[0], domain = email.slice(at + 1);
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

/** The intro asks for an email first. It is stored as the swag email, so step 6 starts prefilled. */
export function validateIntro(s: State): Errors {
  const problem = emailProblem(s.a.swag.email);
  return problem ? { "swag.email": problem } : {};
}

function validCurrent(s: State): Errors {
  const a = s.a, e: Errors = {};
  if (!a.role) e.role = "Select your role.";
  else if (a.role === ROLE_OTHER && !a.roleOther.trim()) e.roleOther = "Tell us your role.";
  if (!a.usage) e.usage = "Select how long you've used Portainer.";
  if (!a.satisfaction) e.satisfaction = REQUIRED;
  if (!a.ease) e.ease = REQUIRED;
  if (!a.frustrations.trim()) e.frustrations = "Tell us what frustrates you most.";
  return e;
}

/** Positive words are required; negative words are optional (some people have none). */
function validWords(s: State, which: WordKey): Errors {
  const w = s.a[which], e: Errors = {};
  if (w.pos.length < PICK_MIN) e[`${which}.pos`] = `Pick at least ${PICK_MIN} positive words. Even small wins count.`;
  if (w.neg.length < PICK_MIN) e[`${which}.neg`] = `Pick at least ${PICK_MIN} negative words. Even small annoyances count.`;
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
  if (!e["swag.email"]) {
    const problem = emailProblem(sw.email);
    if (problem) e["swag.email"] = problem;
  }
  if (!sw.size) e["swag.size"] = "Pick a hoodie size.";
  if (!sw.consent) e["swag.consent"] = "Please tick the consent box so we can ship your hoodie.";
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

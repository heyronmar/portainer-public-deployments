// Aggregates and CSV for the researcher view.
import type { ResponseRow } from "./db";
import { STEP_COUNT, roleLabel, type WordKey, type WordPicks } from "./survey";

export function summary(rows: ResponseRow[]) {
  const sats = rows.map((r) => r.state.a.satisfaction).filter((x): x is number => x !== null);
  const pref = (p: string) => rows.filter((r) => r.state.a.preference === p).length;
  return {
    started: rows.length,
    completed: rows.filter((r) => r.submittedAt).length,
    avgSatisfaction: sats.length ? (sats.reduce((a, b) => a + b, 0) / sats.length).toFixed(1) : "–",
    satisfactionN: sats.length,
    preferV3: pref("Portainer new UI"),
    preferCurrent: pref("Current Portainer UI"),
    noPreference: pref("No preference"),
  };
}

export type WordComment = { id: string; role: string; text: string };
export type SentimentWord = {
  word: string;
  kind: "pos" | "neg";
  count: number;
  comments: WordComment[];
  /** Common words across the comments, as a rough theme summary. */
  themes: string[];
  /** How the same word did on the other UI, for comparison in the pop-up. */
  other: { count: number; people: number };
};
export type Sentiment = { people: number; pos: number; neg: number; words: SentimentWord[] };

const STOP = new Set("a an and are as at be because but by can do does for from get got had has have how i if in into is it its it's just like lot lots more most much my no not of on one or so some than that the their them then there these they this to too very was way we were what when where which while who why will with would you your really things thing feel feels felt looks look ui portainer current v3 also many every all once each other others any less fewer find found make makes made know new old still even ever over under again after before about only same well".split(" "));

/** The most repeated meaningful words across comments (each counted once per comment, seen in at least two). */
function themes(texts: string[], skip: string, limit = 4): string[] {
  const m = new Map<string, number>();
  for (const t of texts)
    for (const w of new Set(t.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []))
      if (!STOP.has(w) && w !== skip.toLowerCase()) m.set(w, (m.get(w) ?? 0) + 1);
  return [...m.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([w]) => w);
}

/** Positive vs negative picks for one UI, with every word's comments. */
export function sentiment(rows: ResponseRow[], which: WordKey): Sentiment {
  const other: WordKey = which === "wordsBefore" ? "wordsAfter" : "wordsBefore";
  const answered = (k: WordKey) => rows.filter((r) => r.state.a[k].pos.length + r.state.a[k].neg.length > 0);
  const mine = answered(which), theirs = answered(other);
  const words = new Map<string, SentimentWord>();
  let pos = 0, neg = 0;
  for (const r of mine)
    for (const kind of ["pos", "neg"] as const)
      for (const word of r.state.a[which][kind]) {
        if (kind === "pos") pos++;
        else neg++;
        const e = words.get(word) ?? { word, kind, count: 0, comments: [], themes: [], other: { count: 0, people: theirs.length } };
        e.count++;
        const text = (r.state.a[which].why[word] ?? "").trim();
        if (text) e.comments.push({ id: r.id, role: roleLabel(r.state.a), text });
        words.set(word, e);
      }
  for (const e of words.values()) {
    e.other.count = theirs.filter((r) => r.state.a[other][e.kind].includes(e.word)).length;
    e.themes = themes(e.comments.map((c) => c.text), e.word);
  }
  return { people: mine.length, pos, neg, words: [...words.values()].sort((a, b) => b.count - a.count || a.word.localeCompare(b.word)) };
}

export const progressLabel = (r: ResponseRow) => (r.submittedAt ? "Complete" : `${r.state.completed.length}/${STEP_COUNT}`);

const whyText = (w: WordPicks) => [...w.pos, ...w.neg].map((x) => `${x}: ${w.why[x] ?? ""}`).join(" | ");

const COLUMNS: [string, (r: ResponseRow) => unknown][] = [
  ["id", (r) => r.id],
  ["created_at", (r) => r.createdAt],
  ["updated_at", (r) => r.updatedAt],
  ["submitted_at", (r) => r.submittedAt],
  ["step", (r) => r.step],
  ["steps_completed", (r) => r.state.completed.length],
  ["role", (r) => roleLabel(r.state.a)],
  ["usage", (r) => r.state.a.usage],
  ["frequency", (r) => r.state.a.frequency],
  ["other_tools", (r) => r.state.a.tools.join("; ")],
  ["satisfaction", (r) => r.state.a.satisfaction],
  ["ease", (r) => r.state.a.ease],
  ["likes", (r) => r.state.a.likes],
  ["frustrations", (r) => r.state.a.frustrations],
  ["current_positive", (r) => r.state.a.wordsBefore.pos.join("; ")],
  ["current_negative", (r) => r.state.a.wordsBefore.neg.join("; ")],
  ["current_why", (r) => whyText(r.state.a.wordsBefore)],
  ["opened_demo", (r) => r.state.openedDemo],
  ["demo_tasks", (r) => r.state.a.demoTasks.join("; ")],
  ["demo_notes", (r) => r.state.a.demoNotes],
  ["v3_positive", (r) => r.state.a.wordsAfter.pos.join("; ")],
  ["v3_negative", (r) => r.state.a.wordsAfter.neg.join("; ")],
  ["v3_why", (r) => whyText(r.state.a.wordsAfter)],
  ["preference", (r) => r.state.a.preference],
  ["recommend_v3", (r) => r.state.a.nps],
  ["final_notes", (r) => r.state.a.finalNotes],
  ["follow_up", (r) => r.state.a.followUp],
  ["swag_name", (r) => r.state.a.swag.name],
  ["swag_email", (r) => r.state.a.swag.email],
  ["swag_company", (r) => r.state.a.swag.company],
  ["swag_address", (r) => r.state.a.swag.address],
  ["swag_city", (r) => r.state.a.swag.city],
  ["swag_postcode", (r) => r.state.a.swag.postcode],
  ["swag_country", (r) => r.state.a.swag.country],
  ["swag_size", (r) => r.state.a.swag.size],
  ["swag_consent", (r) => r.state.a.swag.consent],
];

function cell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  // Stop spreadsheet apps from treating participant text as a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: ResponseRow[]): string {
  const lines = [COLUMNS.map(([h]) => h).join(","), ...rows.map((r) => COLUMNS.map(([, f]) => cell(f(r))).join(","))];
  return "﻿" + lines.join("\r\n") + "\r\n";
}

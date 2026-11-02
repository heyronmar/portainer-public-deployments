// Aggregates and CSV for the researcher view.
import type { ResponseRow } from "./db";
import { STEP_COUNT, type WordKey, type WordPicks } from "./survey";

export function summary(rows: ResponseRow[]) {
  const sats = rows.map((r) => r.state.a.satisfaction).filter((x): x is number => x !== null);
  const pref = (p: string) => rows.filter((r) => r.state.a.preference === p).length;
  return {
    started: rows.length,
    completed: rows.filter((r) => r.submittedAt).length,
    avgSatisfaction: sats.length ? (sats.reduce((a, b) => a + b, 0) / sats.length).toFixed(1) : "–",
    satisfactionN: sats.length,
    preferV3: pref("Portainer V3"),
    preferCurrent: pref("Current Portainer"),
    noPreference: pref("No preference"),
  };
}

/** Most-picked words, highest first. */
export function topWords(rows: ResponseRow[], which: WordKey, kind: "pos" | "neg", limit = 8): [string, number][] {
  const m = new Map<string, number>();
  for (const r of rows) for (const w of r.state.a[which][kind]) m.set(w, (m.get(w) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
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
  ["role", (r) => r.state.a.role],
  ["usage", (r) => r.state.a.usage],
  ["edition", (r) => r.state.a.edition],
  ["frequency", (r) => r.state.a.frequency],
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

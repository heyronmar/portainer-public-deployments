import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WordTag } from "@/components/concept-test/fields";
import { getResponse } from "@/lib/db";
import { progressLabel } from "@/lib/report";
import { STEPS, type WordPicks } from "@/lib/survey";
import { dash, fmtDate } from "../format";

export default function ParticipantPage({ params }: PageProps<"/admin/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <Participant params={params} />
    </Suspense>
  );
}

async function Participant({ params }: { params: PageProps<"/admin/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  const r = getResponse(id);
  if (!r) notFound();
  const { a } = r.state, sw = a.swag;

  return (
    <>
      <Link href="/admin" className="text-[13px] text-muted-foreground hover:text-foreground">← All responses</Link>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] font-semibold tracking-tight">{sw.name || "Anonymous participant"}</h1>
          {r.submittedAt ? <Badge className="bg-pos-soft text-pos">Complete</Badge> : <Badge variant="outline">In progress · {progressLabel(r)}</Badge>}
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {r.id} · started {fmtDate(r.createdAt)} · updated {fmtDate(r.updatedAt)} · submitted {fmtDate(r.submittedAt)} · on step {Math.min(r.step + 1, STEPS.length)} ({STEPS[Math.min(r.step, STEPS.length - 1)].title})
        </p>
      </div>

      <Section title="1. Current Portainer">
        <Pairs items={[
          ["Role", a.role], ["Using Portainer for", a.usage], ["Edition", a.edition], ["Frequency", a.frequency],
          ["Satisfaction (1–5)", a.satisfaction], ["Ease (1–7)", a.ease],
        ]} />
        <Long label="What they like" text={a.likes} />
        <Long label="What frustrates them" text={a.frustrations} />
      </Section>

      <Section title="2. Words: current UI"><Words w={a.wordsBefore} /></Section>

      <Section title="3. Explore V3">
        <Pairs items={[["Opened demo", r.state.openedDemo ? "Yes" : "No"], ["Tried", a.demoTasks.join(", ")]]} />
        <Long label="Notes" text={a.demoNotes} />
      </Section>

      <Section title="4. Words: V3 UI"><Words w={a.wordsAfter} /></Section>

      <Section title="5. Final thoughts">
        <Pairs items={[["Prefers", a.preference], ["Recommend V3 (0–10)", a.nps], ["OK to follow up", a.followUp]]} />
        <Long label="Anything else" text={a.finalNotes} />
      </Section>

      <Section title="6. Swag (personal data)">
        <Pairs items={[
          ["Name", sw.name], ["Email", sw.email], ["Company", sw.company], ["Street address", sw.address],
          ["City", sw.city], ["Postcode", sw.postcode], ["Country", sw.country], ["T-shirt size", sw.size], ["Consent", sw.consent ? "Yes" : "No"],
        ]} />
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="gap-4 rounded-lg p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

function Pairs({ items }: { items: [string, unknown][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="break-words">{dash(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Long({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <p className="whitespace-pre-wrap">{text.trim() || "–"}</p>
    </div>
  );
}

function Words({ w }: { w: WordPicks }) {
  const all = [...w.pos.map((x) => ["pos", x] as const), ...w.neg.map((x) => ["neg", x] as const)];
  if (!all.length) return <p className="text-muted-foreground">No words picked yet.</p>;
  return (
    <div className="flex flex-col gap-3">
      {all.map(([k, x]) => (
        <div key={x} className="grid items-start gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
          <WordTag word={x} kind={k} />
          <p className="whitespace-pre-wrap">{w.why[x]?.trim() || <span className="text-muted-foreground">No reason given</span>}</p>
        </div>
      ))}
    </div>
  );
}

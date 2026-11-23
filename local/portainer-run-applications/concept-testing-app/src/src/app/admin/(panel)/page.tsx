import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listResponses, type ResponseRow } from "@/lib/db";
import { progressLabel, sentiment, summary } from "@/lib/report";
import { roleLabel } from "@/lib/survey";
import { dash, fmtDate } from "./format";
import { DeleteParticipant, ParticipantRow } from "./participant-row";
import { SentimentCards } from "./sentiment";

export default function AdminPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] font-semibold tracking-tight">Responses</h1>
        <p className="text-muted-foreground">Live from the study database. Click a participant to see all of their answers.</p>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Loading responses…</p>}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  await connection();
  const rows = listResponses();
  const s = summary(rows);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat value={s.started} label="Started" />
        <Stat value={s.completed} label="Completed" />
        <Stat value={s.avgSatisfaction} label={`Avg satisfaction today (1–5, n=${s.satisfactionN})`} />
        <Stat value={`${s.preferV3} / ${s.preferCurrent}`} label={`Prefer V3 / current (${s.noPreference} no preference)`} />
      </div>
      <SentimentCards current={sentiment(rows, "wordsBefore")} v3={sentiment(rows, "wordsAfter")} />
      <Card className="gap-0 rounded-lg py-0">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              {["Participant", "Role", "Progress", "Sat.", "Ease", "Prefers", "Recommend", "Hoodie size", "Updated"].map((h) => (
                <TableHead key={h} className="text-xs text-muted-foreground">{h}</TableHead>
              ))}
              <TableHead className="w-12"><span className="sr-only">Delete</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="py-8 text-center text-muted-foreground">No responses yet. Share the test link with participants to start collecting.</TableCell></TableRow>
            ) : rows.map((r) => <Row key={r.id} r={r} />)}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function Row({ r }: { r: ResponseRow }) {
  const a = r.state.a, href = `/admin/${r.id}`, name = a.swag.name || a.swag.email || "Anonymous";
  return (
    <ParticipantRow href={href}>
      <TableCell>
        <Link href={href} className="font-medium underline-offset-4 hover:underline">{name}</Link>
        <span className="ml-2 font-mono text-xs text-muted-foreground">{r.id.slice(0, 6)}</span>
      </TableCell>
      <TableCell>{dash(roleLabel(a))}</TableCell>
      <TableCell>{r.submittedAt ? <Badge className="bg-pos-soft text-pos">Complete</Badge> : progressLabel(r)}</TableCell>
      <TableCell className="tabular-nums">{dash(a.satisfaction)}</TableCell>
      <TableCell className="tabular-nums">{dash(a.ease)}</TableCell>
      <TableCell>{dash(a.preference)}</TableCell>
      <TableCell className="tabular-nums">{dash(a.nps)}</TableCell>
      <TableCell>{dash(a.swag.size)}</TableCell>
      <TableCell className="text-muted-foreground">{fmtDate(r.updatedAt)}</TableCell>
      <TableCell className="py-1 pr-2 text-right"><DeleteParticipant id={r.id} name={name} /></TableCell>
    </ParticipantRow>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <Card className="gap-1 rounded-lg p-3.5">
      <b className="text-[22px] font-semibold tabular-nums">{value}</b>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Card>
  );
}

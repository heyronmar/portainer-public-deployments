import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listResponses, type ResponseRow } from "@/lib/db";
import { progressLabel, summary, topWords } from "@/lib/report";
import type { WordKey } from "@/lib/survey";
import { dash, fmtDate } from "./format";
import { ParticipantRow } from "./participant-row";

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
      <div className="grid gap-3 md:grid-cols-2">
        <WordsCard rows={rows} which="wordsBefore" title="Current UI" />
        <WordsCard rows={rows} which="wordsAfter" title="V3 UI" />
      </div>
      <Card className="gap-0 rounded-lg py-0">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              {["Participant", "Role", "Progress", "Sat.", "Ease", "Prefers", "Recommend", "Swag size", "Updated"].map((h) => (
                <TableHead key={h} className="text-xs text-muted-foreground">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">No responses yet. Share the test link with participants to start collecting.</TableCell></TableRow>
            ) : rows.map((r) => <Row key={r.id} r={r} />)}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function Row({ r }: { r: ResponseRow }) {
  const a = r.state.a, href = `/admin/${r.id}`;
  return (
    <ParticipantRow href={href}>
      <TableCell>
        <Link href={href} className="font-medium underline-offset-4 hover:underline">{a.swag.name || a.swag.email || "Anonymous"}</Link>
        <span className="ml-2 font-mono text-xs text-muted-foreground">{r.id.slice(0, 6)}</span>
      </TableCell>
      <TableCell>{dash(a.role)}</TableCell>
      <TableCell>{r.submittedAt ? <Badge className="bg-pos-soft text-pos">Complete</Badge> : progressLabel(r)}</TableCell>
      <TableCell className="tabular-nums">{dash(a.satisfaction)}</TableCell>
      <TableCell className="tabular-nums">{dash(a.ease)}</TableCell>
      <TableCell>{dash(a.preference)}</TableCell>
      <TableCell className="tabular-nums">{dash(a.nps)}</TableCell>
      <TableCell>{dash(a.swag.size)}</TableCell>
      <TableCell className="text-muted-foreground">{fmtDate(r.updatedAt)}</TableCell>
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

function WordsCard({ rows, which, title }: { rows: ResponseRow[]; which: WordKey; title: string }) {
  return (
    <Card className="gap-4 rounded-lg p-5">
      <span className="text-sm font-medium">{title}</span>
      <Bars list={topWords(rows, which, "pos")} kind="pos" label="Most-picked positive" />
      <Bars list={topWords(rows, which, "neg")} kind="neg" label="Most-picked negative" />
    </Card>
  );
}

function Bars({ list, kind, label }: { list: [string, number][]; kind: "pos" | "neg"; label: string }) {
  const max = Math.max(1, ...list.map(([, n]) => n));
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {list.length === 0 ? <span className="text-[13px] text-muted-foreground">No picks yet</span> : list.map(([w, n]) => (
        <div key={w} className="grid grid-cols-[120px_minmax(0,1fr)_28px] items-center gap-2 text-[12.5px]">
          <span className="truncate">{w}</span>
          <span className="h-2 rounded" style={{ width: `${(n / max) * 100}%`, background: `var(--${kind})` }} />
          <span className="text-right font-mono text-muted-foreground">{n}</span>
        </div>
      ))}
    </div>
  );
}

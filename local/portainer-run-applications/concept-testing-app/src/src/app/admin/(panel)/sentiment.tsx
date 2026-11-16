"use client";
// Current UI vs V3 side by side: an overall verdict, a negative/positive split bar, and the words people picked.
// Clicking a word opens a pop-up with everyone's comments about it.
import { useState } from "react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { ArrowRight, Frown, MessageSquareText, Smile, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Sentiment, SentimentWord } from "@/lib/report";

type Side = { key: "current" | "v3"; title: string; about: string; otherTitle: string; data: Sentiment };

const share = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);

function verdict(pos: number, neg: number) {
  const total = pos + neg;
  if (!total) return "No answers yet";
  const p = pos / total;
  if (p >= 0.8) return "Overwhelmingly positive";
  if (p >= 0.6) return "Mostly positive";
  if (p > 0.4) return "Mixed";
  if (p > 0.2) return "Mostly negative";
  return "Overwhelmingly negative";
}

export function SentimentCards({ current, v3 }: { current: Sentiment; v3: Sentiment }) {
  const [open, setOpen] = useState<{ side: Side; word: SentimentWord } | null>(null);
  const sides: Side[] = [
    { key: "current", title: "Current UI", about: "The Portainer UI people use today", otherTitle: "V3 UI", data: current },
    { key: "v3", title: "V3 UI", about: "The new design people tried in the demo", otherTitle: "Current UI", data: v3 },
  ];
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {sides.map((side) => <SideCard key={side.title} side={side} onWord={(word) => setOpen({ side, word })} />)}
      </div>
      <Dialog.Root open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        {open && <WordDialog side={open.side} word={open.word} />}
      </Dialog.Root>
    </>
  );
}

function SideCard({ side, onWord }: { side: Side; onWord: (w: SentimentWord) => void }) {
  const { people, pos, neg, words } = side.data, total = pos + neg;
  return (
    <Card className={`gap-5 rounded-lg border-t-4 p-5 ${side.key === "v3" ? "border-t-brand" : "border-t-muted-foreground/60"}`}>
      <div className="flex flex-col gap-1.5">
        <SideBadge side={side} />
        <span className="text-[13px] text-muted-foreground">{side.about} · {people} {people === 1 ? "person" : "people"}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Sentiment</span>
        <span className="text-[22px] font-semibold tracking-tight">{verdict(pos, neg)}</span>
      </div>
      <div className="flex h-3 gap-[3px]" role="img" aria-label={`${neg} negative and ${pos} positive word picks`}>
        {total === 0 ? <span className="flex-1 rounded-[4px] bg-muted" /> : (
          <>
            {neg > 0 && <span className="rounded-[4px] bg-neg" style={{ flexGrow: neg }} />}
            {pos > 0 && <span className="rounded-[4px] bg-pos" style={{ flexGrow: pos }} />}
          </>
        )}
      </div>
      <div className="flex gap-8">
        <Count icon={<Frown className="size-4 text-neg" />} label="Negative" n={neg} of={total} />
        <Count icon={<Smile className="size-4 text-pos" />} label="Positive" n={pos} of={total} />
      </div>
      <div className="flex flex-col gap-3 border-t pt-4">
        <span className="text-xs text-muted-foreground">Words people picked. Click one to see what they said.</span>
        <Chips label="Negative" words={words.filter((w) => w.kind === "neg")} onWord={onWord} />
        <Chips label="Positive" words={words.filter((w) => w.kind === "pos")} onWord={onWord} />
      </div>
    </Card>
  );
}

/** The UI a card or pop-up is about. Grey for the current UI, Portainer blue for V3, so they're never mixed up. */
function SideBadge({ side, small }: { side: Side; small?: boolean }) {
  return (
    <span className={`w-fit rounded-md font-semibold tracking-tight ${small ? "px-1.5 py-0.5 text-[12px]" : "px-2.5 py-1 text-[17px]"} ${
      side.key === "v3" ? "bg-brand text-brand-foreground" : "bg-foreground/85 text-background"
    }`}>
      {side.title}
    </span>
  );
}

function Count({ icon, label, n, of }: { icon: React.ReactNode; label: string; n: number; of: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 text-[17px] font-medium tabular-nums">
        {icon}{n}
        {of > 0 && <span className="text-xs font-normal text-muted-foreground">({share(n, of)}%)</span>}
      </span>
    </div>
  );
}

function Chips({ label, words, onWord }: { label: string; words: SentimentWord[]; onWord: (w: SentimentWord) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {words.length === 0 ? <span className="text-[13px] text-muted-foreground">None picked</span> : (
        <div className="flex flex-wrap gap-1.5">
          {words.map((w) => (
            <button
              key={w.word}
              type="button"
              onClick={() => onWord(w)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                w.kind === "pos" ? "border-pos/25 bg-pos-soft text-pos hover:border-pos/60" : "border-neg/25 bg-neg-soft text-neg hover:border-neg/60"
              }`}
            >
              {w.word}
              <span className="font-mono text-[11.5px] font-semibold tabular-nums">{w.count}</span>
              {w.comments.length > 0 && <MessageSquareText className="size-3.5 opacity-70" aria-label={`${w.comments.length} comments`} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WordDialog({ side, word }: { side: Side; word: SentimentWord }) {
  const { people } = side.data, n = word.comments.length;
  const tone = word.kind === "pos" ? "positive" : "negative";
  const summary = [
    `${word.count} of ${people} ${people === 1 ? "person" : "people"} (${share(word.count, people)}%) called the ${side.title} “${word.word}”, a ${tone} word.`,
    n === 0 ? "Nobody added a comment." : n === word.count ? `All of them said why.` : `${n} of them said why.`,
    word.themes.length ? `Comments keep coming back to ${listOf(word.themes)}.` : "",
  ].filter(Boolean).join(" ");
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-lg -translate-1/2 flex-col gap-4 overflow-hidden rounded-xl border bg-background p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-[12px] text-muted-foreground"><SideBadge side={side} small />{tone} word</span>
            <Dialog.Title className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              {word.kind === "pos" ? <Smile className="size-5 text-pos" /> : <Frown className="size-5 text-neg" />}
              {word.word}
            </Dialog.Title>
          </div>
          <Dialog.Close className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close"><X className="size-4" /></Dialog.Close>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat side={side} n={word.count} of={people} />
          <Stat side={{ ...side, key: side.key === "v3" ? "current" : "v3", title: side.otherTitle }} n={word.other.count} of={word.other.people} />
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-3">
          <span className="text-xs font-medium">Summary</span>
          <Dialog.Description className="text-[13px] leading-relaxed text-muted-foreground">{summary}</Dialog.Description>
        </div>
        <div className="flex min-h-0 flex-col gap-2">
          <span className="text-xs font-medium">What people said {n > 0 && <span className="font-normal text-muted-foreground">({n})</span>}</span>
          <ul className="-mr-2 flex min-h-0 flex-col gap-2 overflow-y-auto pr-2">
            {word.comments.map((c, i) => (
              <li key={`${c.id}-${i}`} className="flex flex-col gap-1.5 rounded-lg border p-3">
                <p className="text-[13.5px] leading-relaxed">“{c.text}”</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.role || "Participant"}</span>
                  <Link href={`/admin/${c.id}`} className="inline-flex items-center gap-1 hover:text-foreground">All their answers <ArrowRight className="size-3" /></Link>
                </div>
              </li>
            ))}
            {n === 0 && <li className="text-[13px] text-muted-foreground">No comments for this word yet.</li>}
          </ul>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function Stat({ side, n, of }: { side: Side; n: number; of: number }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border px-3 py-2.5">
      <SideBadge side={side} small />
      <span className="text-[15px] font-medium tabular-nums">
        {of ? `${share(n, of)}%` : "–"} <span className="text-xs font-normal text-muted-foreground">{of ? `${n} of ${of} people` : "no answers yet"}</span>
      </span>
    </div>
  );
}

const listOf = (xs: string[]) => (xs.length < 2 ? `“${xs[0]}”` : `${xs.slice(0, -1).map((x) => `“${x}”`).join(", ")} and “${xs.at(-1)}”`);

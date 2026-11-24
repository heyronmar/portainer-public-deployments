"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  CalendarDays, Check, CalendarRange, Clock, Copy, ExternalLink, Info, KeyRound, Hand, History, MessageCircleHeart,
  Scale as ScaleIcon, Snail, Sparkles, Sun, ThumbsDown, ThumbsUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FOLLOW_UP, FREQUENCY, NEG, PICK_MAX, PICK_MIN, POS, PREFERENCES, ROLE_OTHER, ROLES, SIZES, STEPS, STEP_COUNT, TASKS, TOOL_LEN, TOOLS_MAX, USAGE,
  type Answers, type Errors, type State, type Swag, type WordKey,
} from "@/lib/survey";
import { cn } from "@/lib/utils";
import { Confetti, Dots, Hoodie, StepArt } from "./art";
import { Chips, FaceScale, Field, FieldError, Panel, Scale, TagInput, WordCard, WordTag, type Tone } from "./fields";

export type StepProps = {
  s: State;
  /** Mutate a draft of the state; `persist` saves right away (choices), otherwise the caller saves on blur. */
  set: (fn: (d: State) => void, persist?: boolean) => void;
  save: () => void;
  errors: Errors;
  demoUrl: string;
  demoLogin: DemoLogin | null;
};

export type DemoLogin = { user: string; password: string };

/** Step header: a big card with the step's illustration. `step` is 1-based; omit it on the thank-you screen. */
function Head({ step, title, eyebrow, children }: { step?: number; title: ReactNode; eyebrow?: ReactNode; children?: ReactNode }) {
  const mins = step ? STEPS[step - 1].mins : 0;
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-linear-to-br from-brand-soft via-card to-card p-6 sm:p-8">
      <Dots className="-top-2 right-0" />
      <div className="relative flex flex-col-reverse items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            {step !== undefined && <span className="rounded-full bg-brand px-2.5 py-1 text-brand-foreground">Step {step} of {STEP_COUNT}</span>}
            {mins > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-muted-foreground ring-1 ring-border"><Clock className="size-3.5" />About {mins} min</span>}
            {eyebrow}
          </div>
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-balance sm:text-[30px]">{title}</h1>
          {children && <p className="max-w-[56ch] text-[15px] text-muted-foreground">{children}</p>}
        </div>
        <StepArt step={step === undefined ? STEP_COUNT : step - 1} />
      </div>
    </section>
  );
}

/** Friendly line beside the step chip. */
const Cheer = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center gap-1 text-brand"><Sparkles className="size-3.5" />{children}</span>
);

const ic = "size-5";
const FREQUENCY_ICONS = { Daily: <Sun className={ic} />, Weekly: <CalendarDays className={ic} />, Monthly: <CalendarRange className={ic} />, Rarely: <Snail className={ic} /> };
const PREFERENCE_ICONS = { "Current Portainer UI": <History className={ic} />, "Portainer new UI": <Sparkles className={ic} />, "No preference": <ScaleIcon className={ic} /> };
const FOLLOW_UP_ICONS = { "Yes, happy to chat": <MessageCircleHeart className={ic} />, "No thanks": <Hand className={ic} /> };
// The hoodie grows with the size.
const SIZE_ICONS = Object.fromEntries(SIZES.map((x, i) => [x, <Hoodie key={x} style={{ width: 14 + i * 2, height: 14 + i * 2 }} />]));

/** NPS bands: detractor, passive, promoter. */
const npsTone = (n: number): Tone => (n <= 6 ? "neg" : n <= 8 ? "warn" : "pos");
const NPS_REPLY: Record<Tone, string> = {
  neg: "Thanks for being honest. The box below is a great place to tell us what's missing.",
  warn: "Pretty good! What would make it a 10?",
  pos: "That's wonderful to hear. Thank you!",
};

type TextKey = { [K in keyof Answers]: Answers[K] extends string ? K : never }[keyof Answers];

function TextArea({ id, k, placeholder, invalid, ...p }: StepProps & { id: string; k: TextKey; placeholder: string; invalid?: boolean }) {
  return (
    <Textarea id={id} value={p.s.a[k]} placeholder={placeholder} className="min-h-24 rounded-xl px-3.5 py-3 text-[15px] md:text-[15px]" aria-invalid={invalid || undefined}
      onChange={(e) => p.set((d) => { d.a[k] = e.target.value; })} onBlur={p.save} />
  );
}

function OptionSelect({ id, value, options, onChange, invalid, onCloseAutoFocus }: {
  id: string; value: string; options: string[]; onChange: (v: string) => void; invalid?: boolean; onCloseAutoFocus?: (e: Event) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="h-11! w-full rounded-xl px-3.5 text-[15px]" aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-error` : undefined}>
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent position="popper" onCloseAutoFocus={onCloseAutoFocus}>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

/* ---------- 1. Current Portainer ---------- */

export function StepCurrent(p: StepProps) {
  const { s, set, save, errors: e } = p, a = s.a;
  const focusOther = useRef(false);
  return (
    <>
      <Head step={1} title="How does the current Portainer UI feel today?" eyebrow={<Cheer>Nice to meet you!</Cheer>}>
        Let&apos;s start with the Portainer you use today. There are no wrong answers, just your honest take.
      </Head>
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="role" htmlFor="role" label="Your role" required error={e.role}>
            <OptionSelect id="role" value={a.role} options={ROLES} invalid={!!e.role} onChange={(v) => { focusOther.current = v === ROLE_OTHER; set((d) => { d.a.role = v; }, true); }}
              onCloseAutoFocus={(ev) => {
                // Picking Other reveals a text box; send focus there instead of back to the select.
                if (!focusOther.current) return;
                focusOther.current = false;
                ev.preventDefault();
                requestAnimationFrame(() => document.getElementById("roleOther")?.focus());
              }} />
            {a.role === ROLE_OTHER && (
              <Input id="roleOther" value={a.roleOther} placeholder="Type your role" aria-label="Your role (other)" maxLength={200}
                className="h-11 rounded-xl px-3.5 text-[15px] motion-safe:animate-rise md:text-[15px]"
                aria-invalid={!!e.roleOther || undefined} aria-describedby={e.roleOther ? "roleOther-error" : undefined}
                onChange={(ev) => set((d) => { d.a.roleOther = ev.target.value; })} onBlur={save} />
            )}
            <FieldError name="roleOther" error={e.roleOther} />
          </Field>
          <Field name="usage" htmlFor="usage" label="How long have you used Portainer?" required error={e.usage}>
            <OptionSelect id="usage" value={a.usage} options={USAGE} invalid={!!e.usage} onChange={(v) => set((d) => { d.a.usage = v; }, true)} />
          </Field>
        </div>
        <Field name="frequency" label="How often do you use Portainer?">
          <Chips name="frequency" options={FREQUENCY} icons={FREQUENCY_ICONS} value={a.frequency} onChange={(v) => set((d) => { d.a.frequency = v; }, true)} />
        </Field>
        <Field name="tools" htmlFor="tools" label="What other day-to-day tools do you use alongside Portainer?" hint="Separate them with commas or press Enter.">
          <TagInput id="tools" value={a.tools} max={TOOLS_MAX} maxLength={TOOL_LEN} placeholder="e.g. Rancher, Lens, kubectl, Docker Desktop"
            onChange={(v) => set((d) => { d.a.tools = v; }, true)} />
        </Field>
      </Panel>
      <Panel>
        <Field name="satisfaction" label="Overall, how satisfied are you with the current Portainer UI?" required error={e.satisfaction}>
          <FaceScale name="satisfaction" value={a.satisfaction} invalid={!!e.satisfaction}
            onChange={(v) => set((d) => { d.a.satisfaction = v; }, true)} />
        </Field>
        <Field name="ease" label="How easy is it to get everyday tasks done?" required error={e.ease}>
          <Scale name="ease" from={1} to={7} value={a.ease} lo="Very difficult" hi="Very easy" invalid={!!e.ease}
            onChange={(v) => set((d) => { d.a.ease = v; }, true)} />
        </Field>
      </Panel>
      <Panel>
        <Field name="likes" htmlFor="likes" label="What do you like most about the current UI?">
          <TextArea {...p} id="likes" k="likes" placeholder="e.g. Deploying a stack is quick once I know where things are" />
        </Field>
        <Field name="frustrations" htmlFor="frustrations" label="What frustrates you most?" required error={e.frustrations}>
          <TextArea {...p} id="frustrations" k="frustrations" invalid={!!e.frustrations} placeholder="e.g. Finding the right environment takes too many clicks" />
        </Field>
      </Panel>
    </>
  );
}

/* ---------- 2 & 4. Pick words ---------- */

export function StepWords({ which, ...p }: StepProps & { which: WordKey }) {
  const { s, set, save, errors: e } = p, w = s.a[which], before = which === "wordsBefore";
  const toggle = (kind: "pos" | "neg", x: string) => set((d) => {
    const arr = d.a[which][kind], i = arr.indexOf(x);
    if (i >= 0) arr.splice(i, 1); else if (arr.length < PICK_MAX) arr.push(x);
  }, true);
  const group = (kind: "pos" | "neg", list: string[]) => {
    const picked = w[kind], full = picked.length >= PICK_MAX, key = `${which}.${kind}`;
    return (
      <div data-field={key} className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2.5">
            <span aria-hidden className={cn("grid size-9 place-items-center rounded-xl", kind === "pos" ? "bg-pos-soft text-pos" : "bg-neg-soft text-neg")}>
              {kind === "pos" ? <ThumbsUp className="size-4.5" /> : <ThumbsDown className="size-4.5" />}
            </span>
            <span id={`${key}-label`} className="text-[15px] font-semibold">{kind === "pos" ? "Positive" : "Negative"} words<span className="text-neg"> *</span></span>
          </span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span aria-hidden className="flex gap-1">
              {Array.from({ length: PICK_MAX }, (_, i) => (
                <span key={i} className={cn("size-2.5 rounded-full bg-border transition-colors", i < picked.length && (kind === "pos" ? "bg-pos" : "bg-neg"))} />
              ))}
            </span>
            <span className="font-mono">{picked.length}/{PICK_MAX} picked</span>
          </span>
        </div>
        <p className="-mt-1 text-[13px] text-muted-foreground">
          Pick at least {PICK_MIN}. {kind === "pos" ? "Think about what works well for you, big or small." : "Every tool has rough edges, and knowing yours helps us the most."}
        </p>
        <div role="group" aria-labelledby={`${key}-label`} className="flex flex-wrap gap-2.5">
          {list.map((x) => {
            const on = picked.includes(x);
            return <WordCard key={x} word={x} kind={kind} pressed={on} disabled={!on && full} onClick={() => toggle(kind, x)} />;
          })}
        </div>
        <FieldError name={key} error={e[key]} />
      </div>
    );
  };
  const all = [...w.pos.map((x) => ["pos", x] as const), ...w.neg.map((x) => ["neg", x] as const)];
  return (
    <>
      <Head step={before ? 2 : 4} title={before ? "Describe the current Portainer UI" : "Now describe the new Portainer UI"} eyebrow={<Cheer>{before ? "Quick one" : "Before vs after"}</Cheer>}>
        Pick {PICK_MIN}–{PICK_MAX} positive words and {PICK_MIN}–{PICK_MAX} negative words that best describe {before ? "your experience with Portainer today" : "what you saw in the V3 demo"}. Then tell us why you picked each one.
      </Head>
      <Panel>{group("pos", POS)}{group("neg", NEG)}</Panel>
      {all.length > 0 && (
        <Panel>
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold">Why did you pick these?<span className="text-neg"> *</span></span>
            <span className="text-[13px] text-muted-foreground">A sentence or two each is plenty.</span>
          </div>
          {all.map(([k, x]) => {
            const key = `${which}.why.${x}`, id = `why-${which}-${x.replace(/\W/g, "")}`;
            return (
              <div key={x} data-field={key} className="grid items-start gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                <label htmlFor={id}><WordTag word={x} kind={k} /></label>
                <div className="flex flex-col gap-1.5">
                  <Textarea id={id} value={w.why[x] ?? ""} placeholder={`What made it feel ${x.toLowerCase()}?`} className="min-h-18 rounded-xl px-3.5 py-3 text-[15px] md:text-[15px]"
                    aria-invalid={!!e[key] || undefined} aria-describedby={e[key] ? `${key}-error` : undefined}
                    onChange={(ev) => set((d) => { d.a[which].why[x] = ev.target.value; })} onBlur={save} />
                  <FieldError name={key} error={e[key]} />
                </div>
              </div>
            );
          })}
        </Panel>
      )}
    </>
  );
}

/* ---------- 3. Explore V3 ---------- */

export function StepDemo(p: StepProps) {
  const { s, set, errors: e, demoUrl, demoLogin } = p, a = s.a;
  return (
    <>
      <Head step={3} title="Take Portainer new UI for a spin" eyebrow={<Cheer>The fun part</Cheer>}>
        Open the demo, look around, and see how the new UI compares to the Portainer you use today.
      </Head>
      <div data-field="openedDemo" className="flex flex-col gap-2">
        <Panel className="grid items-center gap-6 border-2 border-brand/40 bg-brand-soft sm:grid-cols-[auto_minmax(0,1fr)]">
          <BrowserArt opened={s.openedDemo} />
          <div className="flex min-w-0 flex-col items-start gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <b className="text-lg">Portainer new UI demo<span className="text-neg"> *</span></b>
              <code className="font-mono text-[12.5px] break-all text-muted-foreground">{demoUrl.replace(/^https?:\/\//, "")}</code>
              {s.openedDemo && <span className="text-[13px] text-pos">Opened. Switch back to that tab any time.</span>}
            </div>
          <Button asChild size="lg" className="h-11 rounded-full bg-brand px-6 text-[15px] text-brand-foreground hover:bg-brand/90">
            <a href={demoUrl} target="_blank" rel="noopener" onClick={() => set((d) => { d.openedDemo = true; }, true)}>
              {s.openedDemo ? "Open again" : "Open demo in new tab"} <ExternalLink />
            </a>
          </Button>
          </div>
          {demoLogin && (
            <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-border sm:col-span-2">
              <span className="flex items-center gap-2 text-[14px] font-semibold"><KeyRound className="size-4 text-brand" />Sign in to the demo with</span>
              <div className="grid gap-2 sm:grid-cols-2">
                <CopyField label="Username" value={demoLogin.user} />
                <CopyField label="Password" value={demoLogin.password} />
              </div>
            </div>
          )}
          <p className="flex items-start gap-2.5 text-[14px] text-muted-foreground sm:col-span-2">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" />
            <span>
              Spend 5–10 minutes exploring how the new UI looks and feels. It&apos;s an early preview, so there might be a few bugs. It&apos;s also a
              sandbox, so you can&apos;t break anything real. Come back to this tab when you&apos;re done.
            </span>
          </p>
        </Panel>
        <FieldError name="openedDemo" error={e.openedDemo} />
      </div>
      <Panel>
        <div className="flex flex-col gap-1">
          <span className="text-[15px] font-semibold">Some things to try</span>
          <span className="text-[13px] text-muted-foreground">A loose guide, not a test. Tick what you tried.</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {TASKS.map((t, i) => (
            <label key={t} htmlFor={`task${i}`}
              className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-border px-3.5 py-3 transition-colors hover:border-muted-foreground/60 has-data-[state=checked]:border-pos has-data-[state=checked]:bg-pos-soft">
              <Checkbox id={`task${i}`} className="mt-0.5" checked={a.demoTasks.includes(t)}
                onCheckedChange={(c) => set((d) => { d.a.demoTasks = c ? [...new Set([...d.a.demoTasks, t])] : d.a.demoTasks.filter((x) => x !== t); }, true)} />
              <span>{t}</span>
            </label>
          ))}
        </div>
        <Field name="demoNotes" htmlFor="demoNotes" label="What did you think of the new UI?">
          <TextArea {...p} id="demoNotes" k="demoNotes" placeholder="e.g. Your first impressions, what stood out, how it compares to today" />
        </Field>
      </Panel>
    </>
  );
}

/* ---------- 5. Final thoughts ---------- */

export function StepFinal(p: StepProps) {
  const { s, set, errors: e } = p, a = s.a;
  return (
    <>
      <Head step={5} title="Final thoughts" eyebrow={<Cheer>Almost there</Cheer>}>A few last questions comparing what you use today with V3.</Head>
      <Panel>
        <Field name="preference" label="Which would you rather use day to day?" required error={e.preference}>
          <Chips name="preference" options={PREFERENCES} icons={PREFERENCE_ICONS} cols="grid-cols-3 sm:grid-cols-3" value={a.preference} invalid={!!e.preference} onChange={(v) => set((d) => { d.a.preference = v; }, true)} />
        </Field>
        <Field name="nps" label="How likely are you to recommend Portainer V3UI to a colleague?" required error={e.nps}>
          <Scale name="nps" from={0} to={10} value={a.nps} lo="Not at all likely" hi="Extremely likely" invalid={!!e.nps} tone={npsTone}
            onChange={(v) => set((d) => { d.a.nps = v; }, true)} />
          {a.nps !== null && (
            <p role="status" className={cn("rounded-xl px-3.5 py-2.5 text-[13.5px] motion-safe:animate-rise", { neg: "bg-neg-soft text-neg", warn: "bg-warn-soft text-warn", pos: "bg-pos-soft text-pos" }[npsTone(a.nps)])}>
              {NPS_REPLY[npsTone(a.nps)]}
            </p>
          )}
        </Field>
      </Panel>
      <Panel>
        <Field name="finalNotes" htmlFor="finalNotes" label="Is there anything else you'd like the team to know?">
          <TextArea {...p} id="finalNotes" k="finalNotes" placeholder="What should we keep, change, or add before V3 ships?" />
        </Field>
        <Field name="followUp" label="Can we follow up with you about your answers?">
          <Chips name="followUp" options={FOLLOW_UP} icons={FOLLOW_UP_ICONS} cols="sm:grid-cols-2" value={a.followUp} onChange={(v) => set((d) => { d.a.followUp = v; }, true)} />
        </Field>
      </Panel>
    </>
  );
}

/* ---------- 6. Claim swag ---------- */

const AUTOCOMPLETE: Partial<Record<keyof Swag, string>> = {
  name: "name", email: "email", company: "organization", address: "street-address", city: "address-level2", postcode: "postal-code", country: "country-name",
};

export function StepSwag(p: StepProps) {
  const { s, set, save, errors: e } = p, sw = s.a.swag;
  const input = (k: Exclude<keyof Swag, "size" | "consent">, label: string, opts: { type?: string; required?: boolean; placeholder?: string } = {}) => {
    const key = `swag.${k}`, required = opts.required ?? true;
    return (
      <Field name={key} htmlFor={`sw-${k}`} label={label} required={required} error={e[key]}>
        <Input id={`sw-${k}`} type={opts.type ?? "text"} value={sw[k]} placeholder={opts.placeholder} autoComplete={AUTOCOMPLETE[k]} className="h-11 rounded-xl px-3.5 text-[15px] md:text-[15px]"
          aria-invalid={!!e[key] || undefined} aria-describedby={e[key] ? `${key}-error` : undefined}
          onChange={(ev) => set((d) => { d.a.swag[k] = ev.target.value; })} onBlur={save} />
      </Field>
    );
  };
  return (
    <>
      <Head step={6} title="Claim your free Portainer Hoodie" eyebrow={<Cheer>You made it!</Cheer>}>
        Thank you for sharing your time and honest feedback. Tell us where to send your Portainer Hoodie. We only use these details to ship your hoodie{s.a.followUp === "Yes, happy to chat" ? " and to follow up as you agreed" : ""}.
      </Head>
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">{input("name", "Full name")}{input("email", "Email", { type: "email" })}</div>
        {input("company", "Company", { required: false })}
        {input("address", "Street address", { placeholder: "Street, unit, building" })}
        <div className="grid gap-4 sm:grid-cols-2">{input("city", "City")}{input("postcode", "Postcode")}</div>
        {input("country", "Country")}
        <Field name="swag.size" label="Hoodie size" required error={e["swag.size"]}>
          <Chips name="swag.size" options={SIZES} icons={SIZE_ICONS} cols="grid-cols-4 sm:grid-cols-7" value={sw.size} invalid={!!e["swag.size"]} onChange={(v) => set((d) => { d.a.swag.size = v; }, true)} />
        </Field>
        <div data-field="swag.consent" className="flex flex-col gap-2">
          <label htmlFor="consent"
            className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-border px-3.5 py-3 transition-colors hover:border-muted-foreground/60 has-data-[state=checked]:border-pos has-data-[state=checked]:bg-pos-soft">
            <Checkbox id="consent" className="mt-0.5" checked={sw.consent} aria-invalid={!!e["swag.consent"] || undefined}
              onCheckedChange={(c) => set((d) => { d.a.swag.consent = c === true; }, true)} />
            <span>I agree that Portainer can use these details to ship my hoodie.<span className="text-neg"> *</span></span>
          </label>
          <FieldError name="swag.consent" error={e["swag.consent"]} />
        </div>
      </Panel>
    </>
  );
}

/* ---------- Thank you ---------- */

export function StepDone({ s }: StepProps) {
  const first = s.a.swag.name.trim().split(/\s+/)[0];
  const tags = (k: WordKey) => (
    <div className="mt-1.5 flex flex-wrap gap-2">
      {s.a[k].pos.map((x) => <WordTag key={x} word={x} kind="pos" />)}
      {s.a[k].neg.map((x) => <WordTag key={x} word={x} kind="neg" />)}
    </div>
  );
  return (
    <>
      <div className="relative">
        <Confetti />
        <Head title={`Thank you${first ? `, ${first}` : ""}`} eyebrow={<Badge className="bg-pos text-white dark:text-background">Session complete</Badge>}>
          Your feedback is in and so is your hoodie request. You&apos;ve helped shape what Portainer V3UI becomes. The study closes on 18 December, and we&apos;ll start shipping hoodies after that. Until then, you can go back to any step to review or change an answer.
        </Head>
      </div>
      <Panel>
        <span className="text-[15px] font-semibold">What you told us</span>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><span className="text-[13px] text-muted-foreground">Current UI</span>{tags("wordsBefore")}</div>
          <div><span className="text-[13px] text-muted-foreground">V3 UI</span>{tags("wordsAfter")}</div>
        </div>
      </Panel>
    </>
  );
}

/** A read-only value with a copy button, e.g. the demo sign-in. */
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); } catch { return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}
      className={cn(
        "flex min-w-0 items-center justify-between gap-3 rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-left transition-colors outline-none hover:border-brand focus-visible:ring-3 focus-visible:ring-ring/50",
        copied && "border-pos bg-pos-soft",
      )}>
      <span className="flex min-w-0 flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="truncate font-mono text-[15px] font-semibold">{value}</span>
      </span>
      <span role="status" className={cn("inline-flex shrink-0 items-center gap-1 text-[13px] font-medium", copied ? "text-pos" : "text-brand")}>
        {copied ? <><Check className="size-4" strokeWidth={3} />Copied</> : <><Copy className="size-4" />Copy</>}
      </span>
    </button>
  );
}

/** A little browser window for the demo card. */
function BrowserArt({ opened }: { opened: boolean }) {
  return (
    <div aria-hidden className="relative hidden w-40 rotate-[-4deg] overflow-hidden rounded-xl bg-card shadow-lg ring-1 ring-border sm:block">
      <div className="flex items-center gap-1 border-b border-border px-2.5 py-2">
        <span className="size-2 rounded-full bg-neg/70" /><span className="size-2 rounded-full bg-warn/70" /><span className="size-2 rounded-full bg-pos/70" />
        <span className="ml-1.5 h-2 flex-1 rounded-full bg-muted" />
      </div>
      <div className="grid grid-cols-[28px_1fr] gap-2 p-2.5">
        <div className="flex flex-col gap-1.5">{[0, 1, 2, 3].map((i) => <span key={i} className={cn("h-2 rounded-full bg-muted", i === 0 && "bg-brand/60")} />)}</div>
        <div className="flex flex-col gap-1.5">
          <span className="h-3 w-3/4 rounded bg-brand/25" />
          <div className="grid grid-cols-2 gap-1.5">{[0, 1, 2, 3].map((i) => <span key={i} className="h-7 rounded-md bg-muted" />)}</div>
        </div>
      </div>
      <span className={cn("absolute right-3 bottom-2 grid size-7 place-items-center rounded-full shadow-md transition-colors", opened ? "bg-pos text-white" : "bg-brand text-brand-foreground motion-safe:animate-float")}>
        {opened ? <Check className="size-4" strokeWidth={3} /> : <ExternalLink className="size-3.5" />}
      </span>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  EDITIONS, FOLLOW_UP, FREQUENCY, NEG, PICK_MAX, PICK_MIN, POS, PREFERENCES, ROLES, SIZES, STEP_COUNT, TASKS, USAGE,
  type Answers, type Errors, type State, type Swag, type WordKey,
} from "@/lib/survey";
import { Chips, Field, FieldError, Panel, Scale, WordCard, WordTag } from "./fields";

export type StepProps = {
  s: State;
  /** Mutate a draft of the state; `persist` saves right away (choices), otherwise the caller saves on blur. */
  set: (fn: (d: State) => void, persist?: boolean) => void;
  save: () => void;
  errors: Errors;
  demoUrl: string;
};

function Head({ step, title, children }: { step?: number; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {step !== undefined && <span className="text-[11px] font-medium tracking-[.08em] text-muted-foreground uppercase">Step {step} of {STEP_COUNT}</span>}
      <h1 className="text-[26px] font-semibold tracking-tight text-balance">{title}</h1>
      {children && <p className="max-w-[62ch] text-muted-foreground">{children}</p>}
    </div>
  );
}

type TextKey = { [K in keyof Answers]: Answers[K] extends string ? K : never }[keyof Answers];

function TextArea({ id, k, placeholder, invalid, ...p }: StepProps & { id: string; k: TextKey; placeholder: string; invalid?: boolean }) {
  return (
    <Textarea id={id} value={p.s.a[k]} placeholder={placeholder} className="min-h-22" aria-invalid={invalid || undefined}
      onChange={(e) => p.set((d) => { d.a[k] = e.target.value; })} onBlur={p.save} />
  );
}

function OptionSelect({ id, value, options, onChange, invalid }: { id: string; value: string; options: string[]; onChange: (v: string) => void; invalid?: boolean }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="h-9 w-full" aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-error` : undefined}>
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent position="popper">
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

/* ---------- 1. Current Portainer ---------- */

export function StepCurrent(p: StepProps) {
  const { s, set, errors: e } = p, a = s.a;
  return (
    <>
      <Head step={1} title="How does Portainer feel today?">
        Thanks for helping shape Portainer V3. This session takes about 15 minutes and you can stop any time: your answers are saved as you go, so you can come back to where you left off.
      </Head>
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="role" htmlFor="role" label="Your role" required error={e.role}>
            <OptionSelect id="role" value={a.role} options={ROLES} invalid={!!e.role} onChange={(v) => set((d) => { d.a.role = v; }, true)} />
          </Field>
          <Field name="usage" htmlFor="usage" label="How long have you used Portainer?" required error={e.usage}>
            <OptionSelect id="usage" value={a.usage} options={USAGE} invalid={!!e.usage} onChange={(v) => set((d) => { d.a.usage = v; }, true)} />
          </Field>
        </div>
        <Field name="edition" label="Which edition do you use?">
          <Chips name="edition" options={EDITIONS} value={a.edition} onChange={(v) => set((d) => { d.a.edition = v; }, true)} />
        </Field>
        <Field name="frequency" label="How often do you use it?">
          <Chips name="frequency" options={FREQUENCY} value={a.frequency} onChange={(v) => set((d) => { d.a.frequency = v; }, true)} />
        </Field>
      </Panel>
      <Panel>
        <Field name="satisfaction" label="Overall, how satisfied are you with the current Portainer UI?" required error={e.satisfaction}>
          <Scale name="satisfaction" from={1} to={5} value={a.satisfaction} lo="Very dissatisfied" hi="Very satisfied" invalid={!!e.satisfaction}
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
      <div data-field={key} className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span id={`${key}-label`} className="text-sm font-medium">{kind === "pos" ? "Positive words" : "Negative words"}<span className="text-neg"> *</span></span>
          <span className="font-mono text-xs text-muted-foreground">{picked.length}/{PICK_MAX} picked</span>
        </div>
        <div role="group" aria-labelledby={`${key}-label`} className="flex flex-wrap gap-2">
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
      <Head step={before ? 2 : 4} title={before ? "Describe the current Portainer UI" : "Now describe the V3 UI"}>
        Pick {PICK_MIN}–{PICK_MAX} positive and {PICK_MIN}–{PICK_MAX} negative words that best describe {before ? "your experience with Portainer today" : "what you saw in the V3 demo"}. Then tell us why you picked each one.
      </Head>
      <Panel>{group("pos", POS)}{group("neg", NEG)}</Panel>
      {all.length > 0 && (
        <Panel>
          <span className="text-sm font-medium">Why did you pick these?</span>
          {all.map(([k, x]) => {
            const key = `${which}.why.${x}`, id = `why-${which}-${x.replace(/\W/g, "")}`;
            return (
              <div key={x} data-field={key} className="grid items-start gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                <label htmlFor={id}><WordTag word={x} kind={k} /></label>
                <div className="flex flex-col gap-1.5">
                  <Textarea id={id} value={w.why[x] ?? ""} placeholder={`What made it feel ${x.toLowerCase()}?`} className="min-h-16"
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
  const { s, set, errors: e, demoUrl } = p, a = s.a;
  return (
    <>
      <Head step={3} title="Explore the Portainer V3 demo">
        The demo opens in a new tab. Take 5–10 minutes to click around and get a feel for it. Nothing you do there affects a real system. When you&apos;re done, come back to this tab and continue.
      </Head>
      <div data-field="openedDemo" className="flex flex-col gap-2">
        <Panel className="grid items-center gap-4 border-brand bg-brand-soft ring-brand sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex min-w-0 flex-col gap-1">
            <b>Portainer V3 demo</b>
            <code className="font-mono text-[12.5px] break-all text-muted-foreground">{demoUrl.replace(/^https?:\/\//, "")}</code>
            {s.openedDemo && <span className="text-[13px] text-muted-foreground">Opened. Switch back to that tab any time.</span>}
          </div>
          <Button asChild size="lg" className="h-9 bg-brand px-4 text-brand-foreground hover:bg-brand/90">
            <a href={demoUrl} target="_blank" rel="noopener" onClick={() => set((d) => { d.openedDemo = true; }, true)}>
              {s.openedDemo ? "Open again" : "Open demo in new tab"} <ExternalLink />
            </a>
          </Button>
        </Panel>
        <FieldError name="openedDemo" error={e.openedDemo} />
      </div>
      <Panel>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Some things to try</span>
          <span className="text-[13px] text-muted-foreground">A loose guide, not a test. Tick what you tried.</span>
        </div>
        <div className="flex flex-col gap-3">
          {TASKS.map((t, i) => (
            <label key={t} htmlFor={`task${i}`} className="flex cursor-pointer items-start gap-2.5">
              <Checkbox id={`task${i}`} className="mt-0.5" checked={a.demoTasks.includes(t)}
                onCheckedChange={(c) => set((d) => { d.a.demoTasks = c ? [...new Set([...d.a.demoTasks, t])] : d.a.demoTasks.filter((x) => x !== t); }, true)} />
              <span>{t}</span>
            </label>
          ))}
        </div>
        <Field name="demoNotes" htmlFor="demoNotes" label="Anything you noticed while exploring?">
          <TextArea {...p} id="demoNotes" k="demoNotes" placeholder="First impressions, surprises, things you couldn't find" />
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
      <Head step={5} title="Final thoughts">Last few questions, comparing what you use today with V3.</Head>
      <Panel>
        <Field name="preference" label="Which would you rather use day to day?" required error={e.preference}>
          <Chips name="preference" options={PREFERENCES} value={a.preference} invalid={!!e.preference} onChange={(v) => set((d) => { d.a.preference = v; }, true)} />
        </Field>
        <Field name="nps" label="How likely are you to recommend Portainer V3 to a colleague?" required error={e.nps}>
          <Scale name="nps" from={0} to={10} value={a.nps} lo="Not at all likely" hi="Extremely likely" invalid={!!e.nps} onChange={(v) => set((d) => { d.a.nps = v; }, true)} />
        </Field>
      </Panel>
      <Panel>
        <Field name="finalNotes" htmlFor="finalNotes" label="Is there anything else you'd like the team to know?">
          <TextArea {...p} id="finalNotes" k="finalNotes" placeholder="What should we keep, change, or add before V3 ships?" />
        </Field>
        <Field name="followUp" label="Can we follow up with you about your answers?">
          <Chips name="followUp" options={FOLLOW_UP} value={a.followUp} onChange={(v) => set((d) => { d.a.followUp = v; }, true)} />
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
        <Input id={`sw-${k}`} type={opts.type ?? "text"} value={sw[k]} placeholder={opts.placeholder} autoComplete={AUTOCOMPLETE[k]} className="h-9"
          aria-invalid={!!e[key] || undefined} aria-describedby={e[key] ? `${key}-error` : undefined}
          onChange={(ev) => set((d) => { d.a.swag[k] = ev.target.value; })} onBlur={save} />
      </Field>
    );
  };
  return (
    <>
      <Head step={6} title="Claim your Portainer swag">
        Thanks for your time. Tell us where to send a thank-you pack. We only use these details to ship your swag{s.a.followUp === "Yes, happy to chat" ? " and to follow up as you agreed" : ""}.
      </Head>
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">{input("name", "Full name")}{input("email", "Email", { type: "email" })}</div>
        {input("company", "Company", { required: false })}
        {input("address", "Street address", { placeholder: "Street, unit, building" })}
        <div className="grid gap-4 sm:grid-cols-2">{input("city", "City")}{input("postcode", "Postcode")}</div>
        {input("country", "Country")}
        <Field name="swag.size" label="T-shirt size" required error={e["swag.size"]}>
          <Chips name="swag.size" options={SIZES} value={sw.size} invalid={!!e["swag.size"]} onChange={(v) => set((d) => { d.a.swag.size = v; }, true)} />
        </Field>
        <div data-field="swag.consent" className="flex flex-col gap-2">
          <label htmlFor="consent" className="flex cursor-pointer items-start gap-2.5">
            <Checkbox id="consent" className="mt-0.5" checked={sw.consent} aria-invalid={!!e["swag.consent"] || undefined}
              onCheckedChange={(c) => set((d) => { d.a.swag.consent = c === true; }, true)} />
            <span>I agree that Portainer can use these details to ship my swag.<span className="text-neg"> *</span></span>
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
      <div className="flex flex-col items-start gap-2">
        <Badge variant="outline">Session complete</Badge>
        <Head title={`Thank you${first ? `, ${first}` : ""}`}>
          Your feedback has been recorded and your swag request is in. You can go back to any step to review or change an answer until we close the study.
        </Head>
      </div>
      <Panel>
        <span className="text-sm font-medium">What you told us</span>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><span className="text-[13px] text-muted-foreground">Current UI</span>{tags("wordsBefore")}</div>
          <div><span className="text-[13px] text-muted-foreground">V3 UI</span>{tags("wordsAfter")}</div>
        </div>
      </Panel>
    </>
  );
}

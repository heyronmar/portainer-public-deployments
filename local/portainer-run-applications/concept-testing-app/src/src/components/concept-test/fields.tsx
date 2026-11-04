"use client";

import type { ReactNode } from "react";
import { Check, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Face } from "./art";

/** Label + control + inline error. `name` is the validation key, used to scroll to the first error. */
export function Field({ name, htmlFor, label, required, hint, error, children, className }: {
  name?: string; htmlFor?: string; label: ReactNode; required?: boolean; hint?: ReactNode; error?: string; children: ReactNode; className?: string;
}) {
  const labelEl = (
    <>
      {label}
      {required && <span className="text-neg"> *</span>}
    </>
  );
  return (
    <div data-field={name} className={cn("flex flex-col gap-2.5", className)}>
      {htmlFor ? <label htmlFor={htmlFor} className="text-[15px] font-semibold">{labelEl}</label> : <span id={name && `${name}-label`} className="text-[15px] font-semibold">{labelEl}</span>}
      {hint && <span className="-mt-1 text-[13px] text-muted-foreground">{hint}</span>}
      {children}
      <FieldError name={name} error={error} />
    </div>
  );
}

export function FieldError({ name, error }: { name?: string; error?: string }) {
  if (!error) return null;
  return <p id={name && `${name}-error`} role="alert" className="text-[13px] text-neg">{error}</p>;
}

const tileBase =
  "relative rounded-xl border-2 border-border bg-background transition-[border-color,background-color,transform] outline-none hover:border-muted-foreground/60 focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:motion-safe:animate-pop";
const tile = cn(tileBase, "hover:-translate-y-0.5 aria-pressed:border-brand aria-pressed:bg-brand-soft");

/** Single-choice cards with an optional icon each. Clicking the selected card clears it. */
export function Chips({ name, options, value, onChange, invalid, icons, cols = "sm:grid-cols-4" }: {
  name: string; options: readonly string[]; value: string; onChange: (v: string) => void; invalid?: boolean;
  icons?: Record<string, ReactNode>; cols?: string;
}) {
  return (
    <div role="group" aria-labelledby={`${name}-label`} aria-describedby={invalid ? `${name}-error` : undefined}
      className={cn("grid grid-cols-2 gap-2.5", cols)}>
      {options.map((o) => {
        const on = value === o;
        return (
          <button key={o} type="button" aria-pressed={on} onClick={() => onChange(on ? "" : o)}
            className={cn(tile, "flex min-h-14 flex-col items-center justify-center gap-2 px-3 py-3.5 text-center text-[14px] font-medium")}>
            {icons?.[o] && (
              <span aria-hidden className={cn("grid size-10 place-items-center rounded-full bg-muted text-muted-foreground transition-colors", on && "bg-brand text-brand-foreground")}>
                {icons[o]}
              </span>
            )}
            {o}
            {on && <Check aria-hidden className="absolute top-2 right-2 size-4 text-brand" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}

export type Tone = "neg" | "warn" | "pos";
const TONE: Record<Tone, { on: string; fill: string }> = {
  neg: { on: "border-neg bg-neg text-white dark:text-background", fill: "border-neg/30 bg-neg-soft" },
  warn: { on: "border-warn bg-warn text-white dark:text-background", fill: "border-warn/30 bg-warn-soft" },
  pos: { on: "border-pos bg-pos text-white dark:text-background", fill: "border-pos/30 bg-pos-soft" },
};
/** Default colouring: bottom third red, middle amber, top green. */
const thirds = (n: number, from: number, to: number): Tone => {
  const t = (n - from) / (to - from);
  return t < 0.34 ? "neg" : t < 0.67 ? "warn" : "pos";
};

/** Numeric rating scale (e.g. 1–7, 0–10) with end labels. Picking a number fills the bar up to it. */
export function Scale({ name, from, to, value, onChange, lo, hi, invalid, tone = thirds }: {
  name: string; from: number; to: number; value: number | null; onChange: (v: number | null) => void; lo: string; hi: string; invalid?: boolean;
  tone?: (n: number, from: number, to: number) => Tone;
}) {
  const nums = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const t = value === null ? null : TONE[tone(value, from, to)];
  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-labelledby={`${name}-label`} aria-describedby={invalid ? `${name}-error` : undefined}
        className="grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns: `repeat(${nums.length}, minmax(0, 1fr))` }}>
        {nums.map((n) => {
          const on = value === n, filled = value !== null && n < value;
          return (
            <button key={n} type="button" aria-pressed={on} onClick={() => onChange(on ? null : n)}
              className={cn(
                tileBase, "h-12 px-0 text-center font-mono text-[15px] font-semibold sm:h-14 sm:text-lg",
                filled && t?.fill, on && t?.on,
              )}>
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground"><span>{lo}</span><span>{hi}</span></div>
    </div>
  );
}

const FACE_LABELS = ["Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"];
const FACE_TONE: Tone[] = ["neg", "neg", "warn", "pos", "pos"];
const FACE_TEXT: Record<Tone, string> = { neg: "text-neg", warn: "text-warn", pos: "text-pos" };

/** 1–5 rating as faces, from frowning to beaming. */
export function FaceScale({ name, value, onChange, invalid }: { name: string; value: number | null; onChange: (v: number | null) => void; invalid?: boolean }) {
  return (
    <div role="group" aria-labelledby={`${name}-label`} aria-describedby={invalid ? `${name}-error` : undefined} className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
      {FACE_LABELS.map((label, i) => {
        const n = i + 1, on = value === n;
        return (
          <button key={n} type="button" aria-pressed={on} aria-label={`${n} – ${label}`} onClick={() => onChange(on ? null : n)}
            className={cn(tile, "flex flex-col items-center gap-2 px-1 py-3 text-muted-foreground sm:py-4", on && "text-foreground")}>
            <span className={cn("size-10 transition-transform sm:size-12", on && [FACE_TEXT[FACE_TONE[i]], "scale-110"])}><Face level={n} /></span>
            <span className="text-[11px] leading-tight font-medium sm:text-xs">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Word card. Positive picks go green, negative red. */
export function WordCard({ word, kind, pressed, disabled, onClick }: {
  word: string; kind: "pos" | "neg"; pressed: boolean; disabled: boolean; onClick: () => void;
}) {
  return (
    <button type="button" aria-pressed={pressed} aria-disabled={disabled || undefined} onClick={() => !disabled && onClick()}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-background py-2 pr-4 pl-3 text-[15px] font-medium transition-colors outline-none hover:border-muted-foreground/60 focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:motion-safe:animate-pop",
        kind === "pos" ? "aria-pressed:border-pos aria-pressed:bg-pos-soft aria-pressed:text-pos" : "aria-pressed:border-neg aria-pressed:bg-neg-soft aria-pressed:text-neg",
        disabled && "cursor-not-allowed opacity-40 hover:border-border",
      )}>
      {pressed ? <Check aria-hidden className="size-4" strokeWidth={3} /> : <Plus aria-hidden className="size-4 text-muted-foreground" />}
      {word}
    </button>
  );
}

export function WordTag({ word, kind }: { word: string; kind: "pos" | "neg" }) {
  return (
    <span className={cn("inline-flex items-center justify-self-start rounded-full px-2.5 py-1 text-[12.5px] font-medium", kind === "pos" ? "bg-pos-soft text-pos" : "bg-neg-soft text-neg")}>
      {word}
    </span>
  );
}

/** Question group: a shadcn Card with roomy spacing. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <Card className={cn("gap-6 rounded-2xl p-5 sm:p-7 motion-safe:animate-rise", className)}>{children}</Card>;
}

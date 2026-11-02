"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    <div data-field={name} className={cn("flex flex-col gap-2", className)}>
      {htmlFor ? <label htmlFor={htmlFor} className="text-sm font-medium">{labelEl}</label> : <span id={name && `${name}-label`} className="text-sm font-medium">{labelEl}</span>}
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

const chipBase =
  "rounded-md border border-border bg-background px-3 py-1.5 text-[13.5px] transition-colors outline-none hover:border-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-brand aria-pressed:bg-brand-soft";

/** Single-choice toggle chips. Clicking the selected chip clears it. */
export function Chips({ name, options, value, onChange, invalid }: {
  name: string; options: readonly string[]; value: string; onChange: (v: string) => void; invalid?: boolean;
}) {
  return (
    <div role="group" aria-labelledby={`${name}-label`} aria-describedby={invalid ? `${name}-error` : undefined} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(value === o ? "" : o)} className={chipBase}>
          {o}
        </button>
      ))}
    </div>
  );
}

/** Numeric rating scale (e.g. 1–5, 1–7, 0–10) with end labels. */
export function Scale({ name, from, to, value, onChange, lo, hi, invalid }: {
  name: string; from: number; to: number; value: number | null; onChange: (v: number | null) => void; lo: string; hi: string; invalid?: boolean;
}) {
  const nums = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  return (
    <div className="flex flex-col gap-1.5">
      <div role="group" aria-labelledby={`${name}-label`} aria-describedby={invalid ? `${name}-error` : undefined}
        className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${nums.length}, minmax(0, 1fr))` }}>
        {nums.map((n) => (
          <button key={n} type="button" aria-pressed={value === n} onClick={() => onChange(value === n ? null : n)}
            className={cn(chipBase, "px-0 py-2 text-center font-mono")}>
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground"><span>{lo}</span><span>{hi}</span></div>
    </div>
  );
}

/** Pill-shaped word card. Positive picks go green, negative red. */
export function WordCard({ word, kind, pressed, disabled, onClick }: {
  word: string; kind: "pos" | "neg"; pressed: boolean; disabled: boolean; onClick: () => void;
}) {
  return (
    <button type="button" aria-pressed={pressed} aria-disabled={disabled || undefined} onClick={() => !disabled && onClick()}
      className={cn(
        "rounded-full border border-border bg-background px-3.5 py-2 text-[13.5px] font-medium transition-colors outline-none hover:border-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        kind === "pos" ? "aria-pressed:border-pos aria-pressed:bg-pos-soft aria-pressed:text-pos" : "aria-pressed:border-neg aria-pressed:bg-neg-soft aria-pressed:text-neg",
        disabled && "cursor-not-allowed opacity-40 hover:border-border",
      )}>
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

/** Question group: a shadcn Card with the prototype's spacing. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <Card className={cn("gap-5 rounded-lg p-5", className)}>{children}</Card>;
}

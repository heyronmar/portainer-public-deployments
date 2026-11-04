// Decorative graphics for the participant flow. All of it is aria-hidden: the questions carry the meaning.

import type { CSSProperties } from "react";
import {
  Compass, Gauge, Gift, Heart, Lightbulb, MessageSquareText, MessagesSquare, MousePointerClick, Package, PartyPopper,
  Shirt, Sparkles, Star, ThumbsDown, ThumbsUp, Trophy, Zap, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Big brand tile with two small tiles floating around it. Index 6 is the thank-you screen. */
const ART: [LucideIcon, LucideIcon, LucideIcon][] = [
  [Gauge, Heart, Zap],
  [MessageSquareText, ThumbsUp, ThumbsDown],
  [Compass, MousePointerClick, Sparkles],
  [MessagesSquare, ThumbsUp, ThumbsDown],
  [Lightbulb, Star, Heart],
  [Gift, Shirt, Package],
  [PartyPopper, Trophy, Star],
];

export function StepArt({ step }: { step: number }) {
  const [Main, A, B] = ART[step] ?? ART[0];
  return (
    <div aria-hidden className="relative size-28 shrink-0 sm:size-36">
      <div className="absolute inset-3 rotate-6 rounded-[28px] bg-brand/20" />
      <div className="absolute inset-3 -rotate-3 grid place-items-center rounded-[28px] bg-brand text-brand-foreground shadow-lg shadow-brand/25">
        <Main className="size-12 sm:size-14" strokeWidth={1.75} />
      </div>
      <div className="absolute -top-1 -right-1 grid size-10 rotate-12 place-items-center rounded-2xl bg-card text-pos shadow-md ring-1 ring-border motion-safe:animate-float sm:size-11">
        <A className="size-5" />
      </div>
      <div className="absolute -bottom-1 -left-2 grid size-9 -rotate-12 place-items-center rounded-2xl bg-card text-warn shadow-md ring-1 ring-border motion-safe:animate-float motion-safe:[animation-delay:-2s] sm:size-10">
        <B className="size-4.5" />
      </div>
    </div>
  );
}

/** Soft dot grid behind the step header. */
export function Dots({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={cn("pointer-events-none absolute text-brand/25", className)} width="180" height="120">
      <defs>
        <pattern id="ct-dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.6" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="180" height="120" fill="url(#ct-dots)" />
    </svg>
  );
}

const MOUTHS = ["M15 32 Q24 24 33 32", "M16 31 Q24 27 32 31", "M16 30 H32", "M16 28 Q24 33 32 28", "M14 27 Q24 38 34 27"];

/** A face for a 1–5 rating, from frowning to beaming. */
export function Face({ level }: { level: number }) {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-full" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="24" cy="24" r="21" fill="currentColor" fillOpacity="0.12" />
      {level === 5 ? (
        <>
          <path d="M14 20 Q17 16 20 20" />
          <path d="M28 20 Q31 16 34 20" />
        </>
      ) : (
        <>
          <circle cx="17.5" cy="19.5" r="2.4" fill="currentColor" stroke="none" />
          <circle cx="30.5" cy="19.5" r="2.4" fill="currentColor" stroke="none" />
        </>
      )}
      <path d={MOUTHS[level - 1]} />
    </svg>
  );
}

const CONFETTI = ["bg-brand", "bg-pos", "bg-warn", "bg-neg"];

/** One burst of confetti from the top of its container. Hidden when the OS asks for reduced motion. */
export function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 hidden h-0 motion-safe:block">
      {Array.from({ length: 28 }, (_, i) => {
        const style = {
          left: `${(i * 37) % 100}%`,
          animationDelay: `${(i % 7) * 0.08}s`,
          "--dx": `${((i * 53) % 120) - 60}px`,
          "--rot": `${((i * 97) % 720) - 360}deg`,
        } as CSSProperties;
        return (
          <span key={i} style={style}
            className={cn("absolute top-0 h-2.5 w-1.5 rounded-[2px] opacity-0 animate-confetti", CONFETTI[i % CONFETTI.length], i % 3 === 0 && "size-2 rounded-full")} />
        );
      })}
    </div>
  );
}

// Decorative graphics for the participant flow. All of it is aria-hidden: the questions carry the meaning.

import type { CSSProperties } from "react";
import Image from "next/image";
import {
  Compass, Gauge, Gift, Heart, Lightbulb, MessageSquareText, MessagesSquare, MousePointerClick, Package, PartyPopper,
  Sparkles, Star, ThumbsDown, ThumbsUp, Trophy, Zap, createLucideIcon, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Lucide has no hoodie, so this one is drawn on the same 24px grid and stroke. */
export const Hoodie = createLucideIcon("Hoodie", [
  ["path", { d: "M8.5 4.8 5 6a2 2 0 0 0-1.3 1.7L3 18a1 1 0 0 0 1 1h1.5a1 1 0 0 0 1-.9L7 11.5V20a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-8.5l.5 6.6a1 1 0 0 0 1 .9H20a1 1 0 0 0 1-1l-.7-10.3A2 2 0 0 0 19 6l-3.5-1.2", key: "body" }],
  ["path", { d: "M8 6.5C8 3.8 9.8 2 12 2s4 1.8 4 4.5c0 1.6-1.8 2.5-4 2.5s-4-.9-4-2.5Z", key: "hood" }],
  ["path", { d: "M10.5 9v3", key: "string-l" }],
  ["path", { d: "M13.5 9v3", key: "string-r" }],
]);

/** Big brand tile with two small tiles floating around it. Index 6 is the thank-you screen. */
const ART: [LucideIcon, LucideIcon, LucideIcon][] = [
  [Gauge, Heart, Zap],
  [MessageSquareText, ThumbsUp, ThumbsDown],
  [Compass, MousePointerClick, Sparkles],
  [MessagesSquare, ThumbsUp, ThumbsDown],
  [Lightbulb, Star, Heart],
  [Gift, Hoodie, Package],
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

/** The thank-you pack: a Portainer hoodie with stickers around it, for the intro. */
export function SwagArt() {
  return (
    <div aria-hidden className="relative mx-auto size-52 sm:size-56">
      <div className="absolute inset-4 rounded-full bg-brand-soft" />
      <div className="absolute inset-9 rounded-full border-2 border-dashed border-brand/25 motion-safe:animate-[spin_40s_linear_infinite]" />
      <div className="absolute inset-0 grid place-items-center motion-safe:animate-float">
        <div className="relative w-36 -rotate-3 drop-shadow-xl sm:w-40">
          <svg viewBox="0 0 120 110" className="w-full text-slate-900 dark:text-slate-700">
            <path d="M40 15 L20 21 Q9 25 8 36 L4 91 Q4 96 9 96 L18 96 Q23 96 23 91 L27 50 L27 101 Q27 106 32 106 L88 106 Q93 106 93 101 L93 50 L97 91 Q97 96 102 96 L111 96 Q116 96 116 91 L112 36 Q111 25 100 21 L80 15 Z" fill="currentColor" />
            {/* hood, its opening, drawstrings, pocket, then cuff and hem seams */}
            <path d="M39 16 Q38 3 60 2 Q82 3 81 16 Q80 31 60 33 Q40 31 39 16 Z" fill="currentColor" />
            <path d="M39 16 Q38 3 60 2 Q82 3 81 16 Q80 31 60 33 Q40 31 39 16 Z" fill="white" fillOpacity="0.07" />
            <path d="M47 17 Q47 8 60 8 Q73 8 73 17 Q72 26 60 27 Q48 26 47 17 Z" fill="black" fillOpacity="0.45" />
            <path d="M55 30 L54 45 M65 30 L66 45" stroke="white" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
            <path d="M41 88 L46 74 H74 L79 88" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="2" strokeLinejoin="round" />
            <path d="M28 99 H92 M5 89 H22 M98 89 H115" stroke="white" strokeOpacity="0.15" strokeWidth="2" />
          </svg>
          <Image src="/logo/portainer.svg" alt="" width={36} height={36} unoptimized className="absolute top-[47%] left-1/2 size-8 -translate-x-1/2 rounded-md sm:size-9" />
        </div>
      </div>
      <div className="absolute top-3 left-1 grid size-14 -rotate-12 place-items-center rounded-full bg-card font-mono text-lg font-bold text-brand shadow-md ring-2 ring-brand/30 motion-safe:animate-float motion-safe:[animation-delay:-1.5s]">V3</div>
      <div className="absolute top-2 right-0 rotate-12 rounded-full bg-pos px-3 py-1.5 text-sm font-bold text-white shadow-md dark:text-background">Free!</div>
      <div className="absolute right-1 bottom-6 grid size-12 rotate-6 place-items-center rounded-2xl bg-warn text-white shadow-md motion-safe:animate-float motion-safe:[animation-delay:-3s] dark:text-background">
        <Gift className="size-6" />
      </div>
      <Sparkles className="absolute bottom-9 left-4 size-5 text-brand" />
      <Star className="absolute top-1/2 -right-1 size-4 fill-warn text-warn" />
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

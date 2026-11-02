"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DONE_STEP, STEPS, STEP_COUNT, isDone, isUnlocked, validateStep, type Errors, type State } from "@/lib/survey";
import { StepCurrent, StepDemo, StepDone, StepFinal, StepSwag, StepWords, type StepProps } from "./steps";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type Session = { id: string; demoUrl: string };

export function ConceptTest() {
  const [session, setSession] = useState<Session | null>(null);
  const [s, setS] = useState<State | null>(null);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [showErrors, setShowErrors] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // The latest state, readable synchronously by save() right after a mutation.
  const ref = useRef<State | null>(null);
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const focusFirstError = useRef(false);

  const load = useCallback(() => {
    fetch("/api/session", { method: "POST" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => {
        ref.current = json.state;
        setS(json.state);
        setSession({ id: json.id, demoUrl: json.demoUrl });
        setStatus("saved");
        if (new URLSearchParams(window.location.search).get("resume") === "notfound") {
          setNotice(json.created
            ? "That resume link wasn't found, so we've started a new session for you."
            : "That resume link wasn't found. You're continuing the session saved on this device.");
          window.history.replaceState(null, "", "/");
        }
      })
      .catch(() => setLoadError("We couldn't load your session. Check your connection and try again."));
  }, []);

  useEffect(load, [load]);

  /** Queue a save of the latest state. Saves run one at a time, in order. */
  const save = useCallback((opts: { submit?: boolean; keepalive?: boolean } = {}) => {
    if (!ref.current) return Promise.resolve(null);
    setStatus("saving");
    const run = chain.current.then(async () => {
      const res = await fetch("/api/session", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: ref.current, submit: opts.submit }),
        keepalive: opts.keepalive,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(json.error || "Save failed"), { status: res.status, body: json });
      setStatus("saved");
      return json as { state: State };
    });
    chain.current = run.catch(() => setStatus("error"));
    return run;
  }, []);

  const set = useCallback<StepProps["set"]>((fn, persist) => {
    if (!ref.current) return;
    const draft = structuredClone(ref.current);
    fn(draft);
    ref.current = draft;
    setS(draft);
    setSubmitError("");
    if (persist) save();
  }, [save]);

  const saveOnBlur = useCallback(() => { save(); }, [save]);

  // Save when the tab is hidden (closing, switching to the demo tab, etc.).
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") save({ keepalive: true }); };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [save]);

  // After a failed Continue, bring the first invalid field into view.
  useLayoutEffect(() => {
    if (!focusFirstError.current) return;
    focusFirstError.current = false;
    const el = document.querySelector<HTMLElement>("[data-field] [role=alert]")?.closest<HTMLElement>("[data-field]");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.querySelector<HTMLElement>("input,textarea,button,[role=combobox]")?.focus({ preventScroll: true });
  });

  if (loadError) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <p>{loadError}</p>
          <Button onClick={() => { setLoadError(""); load(); }}>Try again</Button>
        </div>
      </div>
    );
  }
  if (!s || !session) {
    return (
      <div className="grid min-h-dvh place-items-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  const step = s.step;
  const errors: Errors = showErrors && step < DONE_STEP ? validateStep(s, step) : {};

  const goTo = (i: number) => {
    if (!isUnlocked(s, i) && i !== DONE_STEP) return;
    setShowErrors(false);
    set((d) => { d.step = i; }, true);
    window.scrollTo(0, 0);
  };

  const next = async () => {
    const errs = validateStep(s, step);
    if (Object.keys(errs).length) {
      setShowErrors(true);
      focusFirstError.current = true;
      return;
    }
    setShowErrors(false);
    if (step < STEP_COUNT - 1) {
      set((d) => {
        if (!d.completed.includes(step)) d.completed.push(step);
        d.step = step + 1;
      }, true);
      window.scrollTo(0, 0);
      return;
    }
    // Last step: submit, validated again on the server.
    setSubmitting(true);
    try {
      const json = await save({ submit: true });
      if (json) { ref.current = json.state; setS(json.state); window.scrollTo(0, 0); }
    } catch (err) {
      const body = (err as { body?: { step?: number } }).body;
      if (typeof body?.step === "number") {
        set((d) => { d.step = body.step!; });
        setShowErrors(true);
        focusFirstError.current = true;
      } else {
        setSubmitError("We couldn't submit your answers. Check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const props: StepProps = { s, set, save: saveOnBlur, errors, demoUrl: session.demoUrl };
  const body = [
    <StepCurrent key={0} {...props} />,
    <StepWords key={1} which="wordsBefore" {...props} />,
    <StepDemo key={2} {...props} />,
    <StepWords key={3} which="wordsAfter" {...props} />,
    <StepFinal key={4} {...props} />,
    <StepSwag key={5} {...props} />,
    <StepDone key={6} {...props} />,
  ][step];
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] md:grid-cols-[280px_minmax(0,1fr)]">
      <Sidebar s={s} id={session.id} status={status} onGo={goTo} />
      <main className="min-w-0 px-4 pt-7 pb-12 md:pt-10 md:pb-16">
        <div className="mx-auto flex max-w-[720px] flex-col gap-7">
          {notice && <p role="status" className="rounded-lg border border-border bg-muted px-4 py-3 text-[13px]">{notice}</p>}
          {body}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            {step >= DONE_STEP ? (
              <Button variant="outline" size="lg" className="h-9 px-4" onClick={() => goTo(STEP_COUNT - 1)}>Review answers</Button>
            ) : (
              <>
                <div>{step > 0 && <Button variant="ghost" size="lg" className="h-9 px-4 text-muted-foreground" onClick={() => goTo(step - 1)}>← Back</Button>}</div>
                <div className="flex flex-wrap items-center gap-3">
                  {(hasErrors || submitError) && (
                    <span role="alert" className="text-[13px] text-neg">
                      {submitError || (step === 2 ? errors.openedDemo : "Please fix the highlighted questions.")}
                    </span>
                  )}
                  <Button size="lg" className="h-9 px-4" onClick={next} disabled={submitting}>
                    {submitting && <Loader2 className="animate-spin" />}
                    {step === STEP_COUNT - 1 ? "Submit" : "Continue →"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Sidebar({ s, id, status, onGo }: { s: State; id: string; status: SaveStatus; onGo: (i: number) => void }) {
  const n = s.completed.length;
  return (
    <aside className="flex min-w-0 flex-col gap-4 border-b border-border bg-muted px-4 py-5 md:sticky md:top-0 md:h-dvh md:gap-6 md:border-r md:border-b-0 md:px-5 md:py-6">
      <div className="flex items-center gap-2.5">
        <div aria-hidden className="grid size-7 place-items-center rounded-md bg-brand text-[13px] font-bold text-brand-foreground">P</div>
        <div className="leading-tight">
          <b className="block text-sm">Portainer V3</b>
          <span className="text-xs text-muted-foreground">Concept test · self-paced</span>
        </div>
      </div>
      <nav aria-label="Session steps">
        <div className="mb-2 hidden text-[11px] font-medium tracking-[.08em] text-muted-foreground uppercase md:block">Your session</div>
        <ol className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:gap-0.5 md:overflow-visible md:pb-0">
          {STEPS.map((st, i) => {
            const done = isDone(s, i), current = s.step === i, locked = !isUnlocked(s, i);
            return (
              <li key={i} aria-current={current ? "step" : undefined} className="flex-none">
                <button type="button" disabled={locked} onClick={() => onGo(i)}
                  className={cn(
                    "grid w-full grid-cols-[24px_auto] items-start gap-2.5 rounded-md px-2.5 py-1.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:grid-cols-[24px_1fr] md:py-2",
                    "enabled:hover:bg-card disabled:cursor-not-allowed disabled:opacity-55",
                    current && "bg-card ring-1 ring-border",
                  )}>
                  <span className={cn(
                    "grid size-6 place-items-center rounded-full border border-border bg-background font-mono text-[11px]",
                    current && "border-brand text-brand",
                    done && "border-brand bg-brand text-brand-foreground",
                  )}>
                    {done ? <Check className="size-3.5" aria-label="done" /> : i + 1}
                  </span>
                  <span className="whitespace-nowrap md:whitespace-normal">
                    <span className="block text-[13px] font-medium">{st.title}</span>
                    <span className="hidden text-xs text-muted-foreground md:block">{st.sub}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="flex flex-col gap-2.5 text-xs text-muted-foreground md:mt-auto">
        <Progress value={(n / STEP_COUNT) * 100} className="h-1.5 bg-border *:data-[slot=progress-indicator]:bg-brand" aria-label="Progress" />
        <div>{n} of {STEP_COUNT} steps complete</div>
        <SaveIndicator status={status} />
        <ResumeLink id={id} />
      </div>
    </aside>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const text = { idle: "Not saved yet", saving: "Saving…", saved: "Progress saved", error: "Not saved. Check your connection." }[status];
  return (
    <div role="status" className="flex items-center gap-1.5">
      <span className={cn("size-1.5 rounded-full bg-muted-foreground", status === "saved" && "bg-pos", status === "error" && "bg-neg")} />
      {text}
    </div>
  );
}

function ResumeLink({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  // Only rendered after the session loads in the browser, so window is available.
  const url = `${window.location.origin}/r/${id}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex flex-col gap-1.5 border-t border-border pt-3">
      <span className="font-medium text-foreground">Resume link</span>
      <span>Use this to continue on another device. Keep it private: it opens your answers.</span>
      <div className="flex items-center gap-1.5">
        <input readOnly value={url} aria-label="Resume link" onFocus={(e) => e.target.select()}
          className="h-7 min-w-0 flex-1 rounded-md border border-border bg-background px-2 font-mono text-[11px] text-foreground" />
        <Button variant="outline" size="icon-sm" onClick={copy} aria-label="Copy resume link">
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
    </div>
  );
}

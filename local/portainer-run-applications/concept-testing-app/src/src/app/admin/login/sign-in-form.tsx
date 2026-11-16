"use client";
// Same look as the participant sign-in on the home page: centered card-less form, big inputs, pill button.
import { Suspense, useActionState, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/concept-test/fields";
import { signIn, type SignInState } from "../actions";

const inputCls = "h-12 rounded-xl px-4 text-[16px] md:text-[16px]";

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  const [show, setShow] = useState(false);
  const err = state.error;
  return (
    <form action={action} noValidate className="flex w-full max-w-[400px] flex-col items-center gap-6 text-center motion-safe:animate-rise">
      <Image src="/logo/portainer.svg" alt="Portainer" width={56} height={56} unoptimized priority className="size-14" />
      <div className="flex flex-col gap-3">
        <h1 className="text-[30px] leading-tight font-semibold tracking-tight text-balance sm:text-[34px]">Researcher sign in</h1>
        <p className="text-[16px] text-muted-foreground text-pretty">See the responses and feedback from the Portainer V3 concept test.</p>
      </div>
      <Suspense><NextPath /></Suspense>
      <div className="flex w-full flex-col gap-4 text-left">
        <div className="flex flex-col gap-2">
          <label htmlFor="admin-user" className="text-[15px] font-semibold">Username</label>
          <Input id="admin-user" name="user" autoComplete="username" autoCapitalize="none" spellCheck={false} required
            defaultValue={state.user} key={state.user} autoFocus={!state.user} className={inputCls}
            aria-invalid={!!err || undefined} aria-describedby={err ? "admin-error" : undefined} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="admin-password" className="text-[15px] font-semibold">Password</label>
          <div className="relative">
            <Input id="admin-password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required
              autoFocus={!!state.user} className={`${inputCls} pr-12`}
              aria-invalid={!!err || undefined} aria-describedby={err ? "admin-error" : undefined} />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
              {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
            </button>
          </div>
        </div>
        <FieldError name="admin" error={err} />
      </div>
      <Button type="submit" size="lg" disabled={pending} className="h-12 w-full rounded-full bg-brand text-[16px] text-brand-foreground shadow-lg shadow-brand/25 hover:bg-brand/90">
        {pending ? <><Loader2 className="size-4 animate-spin" />Signing in…</> : <>Sign in →</>}
      </Button>
      <p className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <Lock className="size-3.5" />Only the research team can see responses
      </p>
    </form>
  );
}

/** Where to go after signing in. Read on the client so the rest of the page can be prerendered. */
function NextPath() {
  const next = useSearchParams().get("next");
  return next ? <input type="hidden" name="next" value={next} /> : null;
}

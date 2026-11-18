"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow } from "@/components/ui/table";
import { deleteParticipant } from "../actions";

/** Whole row opens the participant; the name cell also holds a real link for keyboard users. */
export function ParticipantRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <TableRow className="cursor-pointer" onClick={(e) => {
      // React bubbles clicks from portals (the delete dialog) through here, so only count clicks inside the row itself.
      const t = e.target as HTMLElement;
      if (e.currentTarget.contains(t) && !t.closest("a, button")) router.push(href);
    }}>
      {children}
    </TableRow>
  );
}

const EXPIRED = "Your session has expired. Sign in again to delete records.";

/** Removes a test or junk record after a confirmation step. */
export function DeleteParticipant({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const remove = () => start(async () => {
    // A signed-out request is stopped by the /admin proxy before it reaches the action, which surfaces here as a throw.
    const res = await deleteParticipant(id).catch(() => ({ error: EXPIRED }));
    if (res.error) { setError(res.error); return; }
    setOpen(false);
    router.refresh();
  });
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!pending) { setOpen(o); setError(""); } }}>
      <Dialog.Trigger aria-label={`Delete ${name}`} title="Delete record"
        className="grid size-8 place-items-center rounded-md text-muted-foreground outline-none hover:bg-neg-soft hover:text-neg focus-visible:ring-3 focus-visible:ring-ring/50">
        <Trash2 className="size-4" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-md -translate-1/2 flex-col gap-4 rounded-xl border bg-background p-5 shadow-xl">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-neg-soft text-neg"><Trash2 className="size-5" /></span>
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-lg font-semibold tracking-tight">Delete this record?</Dialog.Title>
              <Dialog.Description className="text-[13.5px] leading-relaxed text-muted-foreground">
                <b className="font-medium text-foreground">{name}</b> <span className="font-mono text-xs">{id.slice(0, 6)}</span> and all of their answers
                and swag details will be removed from the results and the CSV. This can&apos;t be undone.
              </Dialog.Description>
            </div>
          </div>
          {error && (
            <p role="alert" className="text-[13px] text-neg">
              {error}{error === EXPIRED && <> <a href="/admin/login" className="font-medium underline underline-offset-4">Sign in</a></>}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Dialog.Close asChild><Button variant="outline" disabled={pending}>Cancel</Button></Dialog.Close>
            <Button onClick={remove} disabled={pending} className="bg-neg text-white hover:bg-neg/90">
              {pending ? <><Loader2 className="size-4 animate-spin" />Deleting…</> : "Delete record"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

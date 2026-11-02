"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";

/** Whole row opens the participant; the name cell also holds a real link for keyboard users. */
export function ParticipantRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <TableRow className="cursor-pointer" onClick={(e) => { if (!(e.target as HTMLElement).closest("a")) router.push(href); }}>
      {children}
    </TableRow>
  );
}

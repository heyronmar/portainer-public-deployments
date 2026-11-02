import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Responses · Portainer V3 Concept Test", robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-muted">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div aria-hidden className="grid size-7 place-items-center rounded-md bg-brand text-[13px] font-bold text-brand-foreground">P</div>
            <div className="leading-tight">
              <b className="block text-sm">Portainer V3 concept test</b>
              <span className="text-xs text-muted-foreground">Researcher view</span>
            </div>
          </Link>
          <Button asChild variant="outline" size="lg" className="h-9 px-3">
            {/* Plain <a>: a file download, not a client-side navigation. */}
            <a href="/admin/export.csv" download><Download /> Export CSV</a>
          </Button>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">{children}</main>
    </div>
  );
}

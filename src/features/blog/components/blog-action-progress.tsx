"use client";

import { Loader2 } from "lucide-react";

export function BlogActionProgress({ open, title, description }: { open: boolean; title: string; description: string }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-leehov-navy-950/35 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-action-title"
        aria-describedby="blog-action-description"
        className="w-full max-w-md overflow-hidden rounded-[22px] border border-leehov-border bg-white shadow-2xl"
      >
        <div className="h-1.5 w-full overflow-hidden bg-leehov-blue-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-leehov-blue-500 to-leehov-cyan motion-reduce:animate-none" />
        </div>
        <div className="flex items-start gap-4 p-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-leehov-blue-50 text-leehov-blue-600">
            <Loader2 className="size-6 animate-spin motion-reduce:animate-none" />
          </div>
          <div className="space-y-2 text-left">
            <h2 id="blog-action-title" className="text-lg font-extrabold text-leehov-navy-950">{title}</h2>
            <p id="blog-action-description" className="leading-6 text-leehov-muted">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

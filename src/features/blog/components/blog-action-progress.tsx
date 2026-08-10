"use client";

import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function BlogActionProgress({ open, title, description }: { open: boolean; title: string; description: string }) {
  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-[22px] border-leehov-border p-0 sm:max-w-md"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <div className="h-1.5 w-full overflow-hidden bg-leehov-blue-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-leehov-blue-500 to-leehov-cyan motion-reduce:animate-none" />
        </div>
        <div className="flex items-start gap-4 p-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-leehov-blue-50 text-leehov-blue-600">
            <Loader2 className="size-6 animate-spin motion-reduce:animate-none" />
          </div>
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="text-lg font-extrabold text-leehov-navy-950">{title}</DialogTitle>
            <DialogDescription className="leading-6 text-leehov-muted">{description}</DialogDescription>
          </DialogHeader>
        </div>
      </DialogContent>
    </Dialog>
  );
}

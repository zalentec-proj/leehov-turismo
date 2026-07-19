"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[65vh] items-center justify-center bg-leehov-surface px-5 py-20">
      <div className="max-w-lg rounded-[24px] border border-leehov-border bg-white p-8 text-center shadow-leehov-card sm:p-10">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-destructive"><AlertTriangle className="size-6" aria-hidden="true" /></span>
        <h1 className="mt-5 text-2xl font-extrabold text-leehov-navy-950">Não foi possível carregar esta página</h1>
        <p className="mt-3 text-sm leading-6 text-leehov-muted">Tente novamente. Se o problema continuar, entre em contato com a equipe Leehov.</p>
        <Button type="button" className="mt-6 rounded-full bg-leehov-blue-600 px-5 text-white" onClick={reset}><RotateCcw className="size-4" />Tentar novamente</Button>
      </div>
    </div>
  );
}

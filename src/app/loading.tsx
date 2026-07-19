import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center bg-leehov-surface px-5" role="status" aria-live="polite">
      <div className="text-center">
        <LoaderCircle className="mx-auto size-8 animate-spin text-leehov-blue-500 motion-reduce:animate-none" aria-hidden="true" />
        <p className="mt-4 text-sm font-semibold text-leehov-navy-950">Carregando conteúdo...</p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-leehov-navy-950 px-5 py-20 text-white">
      <div className="max-w-xl text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-white/15 bg-white/8"><Compass className="size-7 text-leehov-blue-300" aria-hidden="true" /></span>
        <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-300">Erro 404</p>
        <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Este caminho não foi encontrado</h1>
        <p className="mt-5 leading-7 text-white/65">O conteúdo pode ter mudado de endereço ou ainda não estar publicado.</p>
        <Button asChild size="lg" className="mt-8 rounded-full bg-white px-6 text-leehov-navy-950 hover:bg-leehov-surface"><Link href="/"><ArrowLeft className="size-4" />Voltar para a Home</Link></Button>
      </div>
    </main>
  );
}

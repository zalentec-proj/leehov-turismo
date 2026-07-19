import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/leehov/shared/status-badge";
import type { CaravanSummary } from "@/features/caravans/types";

export function CaravanCard({ caravan }: { caravan: CaravanSummary }) {
  return (
    <Card className="overflow-hidden rounded-[18px] border-leehov-border bg-white p-0 shadow-leehov-card transition hover:-translate-y-1 hover:shadow-leehov-floating motion-reduce:transition-none">
      <div className="relative h-56 overflow-hidden bg-leehov-surface">{caravan.imageUrl ? <Image src={caravan.imageUrl} alt={`Imagem da caravana ${caravan.title}`} fill unoptimized sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" /> : null}</div>
      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between gap-3">
          <StatusBadge status={caravan.status} />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-leehov-blue-600">
            Grupo acompanhado
          </span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-leehov-navy-950">
            {caravan.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-leehov-muted">
            {caravan.summary}
          </p>
        </div>
        <div className="grid gap-2 text-sm text-leehov-text">
          <span className="flex items-center gap-2">
            <MapPin className="size-4 text-leehov-blue-500" />
            {caravan.destination}
          </span>
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4 text-leehov-blue-500" />
            {caravan.departureLabel}
          </span>
          <span className="flex items-center gap-2">
            <UsersRound className="size-4 text-leehov-blue-500" />
            {caravan.duration}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-bold text-leehov-navy-950">
            {caravan.price || "Sob consulta"}
          </span>
          <Button asChild className="rounded-full bg-leehov-blue-600 text-white hover:bg-leehov-cyan">
            <Link href={`/caravanas/${caravan.slug}`}>Ver detalhes</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

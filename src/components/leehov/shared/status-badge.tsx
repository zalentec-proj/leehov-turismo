import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusLabels = {
  available: "Disponível",
  coming_soon: "Em breve",
  waitlist: "Lista de espera",
  sold_out: "Esgotado",
  draft: "Rascunho",
  published: "Publicado",
  new: "Novo",
  in_progress: "Em atendimento",
  converted: "Convertido",
  archived: "Arquivado",
  sent: "Enviado",
  failed: "Falhou",
} as const;

type StatusKey = keyof typeof statusLabels;

const statusClasses: Record<StatusKey, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  coming_soon: "border-amber-200 bg-amber-50 text-amber-700",
  waitlist: "border-sky-200 bg-sky-50 text-sky-700",
  sold_out: "border-red-200 bg-red-50 text-red-700",
  draft: "border-slate-200 bg-slate-50 text-slate-600",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  new: "border-sky-200 bg-sky-50 text-sky-700",
  in_progress: "border-amber-200 bg-amber-50 text-amber-700",
  converted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-slate-200 bg-slate-50 text-slate-600",
  sent: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-red-200 bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: StatusKey }) {
  return (
    <Badge variant="outline" className={cn("rounded-full", statusClasses[status])}>
      {statusLabels[status]}
    </Badge>
  );
}

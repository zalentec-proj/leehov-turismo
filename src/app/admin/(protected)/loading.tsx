import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-7" role="status" aria-label="Carregando painel">
      <div className="space-y-3"><Skeleton className="h-3 w-32" /><Skeleton className="h-10 w-72" /></div>
      <div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-28 rounded-[18px]" /><Skeleton className="h-28 rounded-[18px]" /><Skeleton className="h-28 rounded-[18px]" /></div>
      <Skeleton className="h-[420px] rounded-[18px]" />
    </div>
  );
}

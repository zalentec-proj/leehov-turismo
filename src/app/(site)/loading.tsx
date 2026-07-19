import { Skeleton } from "@/components/ui/skeleton";

export default function SiteLoading() {
  return (
    <div className="bg-white px-5 pb-24 pt-36 sm:px-8 lg:px-12" role="status" aria-label="Carregando página">
      <div className="mx-auto max-w-7xl space-y-8">
        <Skeleton className="h-4 w-36 rounded-full" />
        <Skeleton className="h-14 max-w-3xl rounded-2xl" />
        <Skeleton className="h-[420px] w-full rounded-[28px]" />
      </div>
    </div>
  );
}

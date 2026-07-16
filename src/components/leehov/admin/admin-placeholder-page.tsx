import { AdminShell } from "@/components/leehov/admin/admin-shell";
import { Card } from "@/components/ui/card";

type AdminPlaceholderPageProps = {
  title: string;
  description: string;
  items: string[];
};

export function AdminPlaceholderPage({
  title,
  description,
  items,
}: AdminPlaceholderPageProps) {
  return (
    <AdminShell>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">
          Módulo admin
        </p>
        <h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-leehov-muted">
          {description}
        </p>
      </div>
      <Card className="rounded-[18px] border-leehov-border p-6 shadow-leehov-card">
        <h3 className="text-lg font-bold text-leehov-navy-950">
          Próximas implementações
        </h3>
        <ul className="mt-5 grid gap-3 text-sm text-leehov-text md:grid-cols-2">
          {items.map((item) => (
            <li key={item} className="rounded-xl bg-leehov-surface px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </AdminShell>
  );
}

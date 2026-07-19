import { saveCaravanCategoryAction } from "@/features/caravans/actions";
import type { CaravanCategory } from "@/features/caravans/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CategoryManager({ categories }: { categories: CaravanCategory[] }) {
  return (
    <details className="mb-8 rounded-[18px] border border-leehov-border bg-white p-5">
      <summary className="cursor-pointer font-bold text-leehov-navy-950">Gerenciar categorias</summary>
      <div className="mt-6 space-y-4">
        <Card className="rounded-[16px] border-leehov-border p-4">
          <form action={saveCaravanCategoryAction} className="grid gap-3 md:grid-cols-[1fr_1fr_100px_auto] md:items-end">
            <input type="hidden" name="id" value="" /><input type="hidden" name="active" value="true" />
            <div className="space-y-2"><Label>Nova categoria</Label><Input name="name" required /></div>
            <div className="space-y-2"><Label>Slug</Label><Input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></div>
            <div className="space-y-2"><Label>Ordem</Label><Input name="sortOrder" type="number" min={0} defaultValue={categories.length * 10 + 10} /></div>
            <Button type="submit">Adicionar</Button>
          </form>
        </Card>
        {categories.map((category) => (
          <Card key={category.id} className="rounded-[16px] border-leehov-border p-4">
            <form action={saveCaravanCategoryAction} className="grid gap-3 md:grid-cols-[1fr_1fr_100px_auto_auto] md:items-end">
              <input type="hidden" name="id" value={category.id} />
              <input type="hidden" name="description" value={category.description ?? ""} />
              <input type="hidden" name="active" value={String(category.active)} />
              <div className="space-y-2"><Label>Nome</Label><Input name="name" defaultValue={category.name} required /></div>
              <div className="space-y-2"><Label>Slug</Label><Input name="slug" defaultValue={category.slug} required /></div>
              <div className="space-y-2"><Label>Ordem</Label><Input name="sortOrder" type="number" min={0} defaultValue={category.sort_order} /></div>
              <Badge variant={category.active ? "default" : "outline"} className="mb-2">{category.active ? "Ativa" : "Inativa"}</Badge>
              <Button type="submit" variant="outline">Salvar</Button>
            </form>
            <form action={saveCaravanCategoryAction} className="mt-3">
              <input type="hidden" name="id" value={category.id} /><input type="hidden" name="name" value={category.name} /><input type="hidden" name="slug" value={category.slug} /><input type="hidden" name="description" value={category.description ?? ""} /><input type="hidden" name="sortOrder" value={category.sort_order} /><input type="hidden" name="active" value={String(!category.active)} />
              <Button type="submit" size="sm" variant="ghost">{category.active ? "Desativar categoria" : "Reativar categoria"}</Button>
            </form>
          </Card>
        ))}
      </div>
    </details>
  );
}

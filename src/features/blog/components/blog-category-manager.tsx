import { saveBlogCategoryAction } from "@/features/blog/actions";
import type { BlogCategory } from "@/features/blog/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BlogCategoryManager({ categories }: { categories: BlogCategory[] }) {
  return (
    <details className="mb-8 rounded-[18px] border border-leehov-border bg-white p-5">
      <summary className="cursor-pointer font-bold text-leehov-navy-950">Gerenciar categorias editoriais</summary>
      <div className="mt-6 space-y-4">
        <Card className="rounded-[16px] border-leehov-border p-4">
          <form action={saveBlogCategoryAction} className="grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-end">
            <input type="hidden" name="id" value="" />
            <div className="space-y-2"><Label>Nova categoria</Label><Input name="name" required /></div>
            <div className="space-y-2"><Label>Slug</Label><Input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></div>
            <div className="space-y-2"><Label>Descrição</Label><Input name="description" /></div>
            <Button type="submit">Adicionar</Button>
          </form>
        </Card>
        <div className="grid gap-4 lg:grid-cols-2">
          {categories.map((category) => (
            <Card key={category.id} className="rounded-[16px] border-leehov-border p-4">
              <form action={saveBlogCategoryAction} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={category.id} />
                <div className="space-y-2"><Label>Nome</Label><Input name="name" defaultValue={category.name} required /></div>
                <div className="space-y-2"><Label>Slug</Label><Input name="slug" defaultValue={category.slug} required /></div>
                <div className="space-y-2 sm:col-span-2"><Label>Descrição</Label><Input name="description" defaultValue={category.description} /></div>
                <div className="sm:col-span-2"><Button type="submit" variant="outline">Salvar categoria</Button></div>
              </form>
            </Card>
          ))}
        </div>
      </div>
    </details>
  );
}

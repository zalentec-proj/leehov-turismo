import { updateProfileAction } from "@/features/auth/actions";
import { getAdminProfiles } from "@/features/auth/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function AdminUsersPage() {
  const profiles = await getAdminProfiles();

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Administração</p>
      <h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950">Usuários e permissões</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-leehov-muted">
        Novos perfis entram como editores inativos. Somente o administrador geral pode aprovar acessos e alterar papéis.
      </p>
      <div className="mt-8 space-y-4">
        {profiles.map((profile) => (
          <Card key={profile.id} className="flex flex-col gap-5 rounded-[18px] border-leehov-border p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-leehov-navy-950">{profile.name || "Usuário administrativo"}</p>
                {profile.role === "admin" ? <Badge>Admin geral</Badge> : <Badge variant="secondary">Editor</Badge>}
                <Badge variant={profile.active ? "default" : "outline"}>{profile.active ? "Ativo" : "Aguardando aprovação"}</Badge>
              </div>
              <p className="mt-2 text-sm text-leehov-muted">{profile.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={updateProfileAction}>
                <input type="hidden" name="id" value={profile.id} />
                <input type="hidden" name="role" value={profile.role === "admin" ? "editor" : "admin"} />
                <input type="hidden" name="active" value={String(profile.active)} />
                <Button type="submit" variant="outline">Tornar {profile.role === "admin" ? "editor" : "admin"}</Button>
              </form>
              <form action={updateProfileAction}>
                <input type="hidden" name="id" value={profile.id} />
                <input type="hidden" name="role" value={profile.role} />
                <input type="hidden" name="active" value={String(!profile.active)} />
                <Button type="submit" variant={profile.active ? "outline" : "default"}>{profile.active ? "Desativar" : "Aprovar acesso"}</Button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

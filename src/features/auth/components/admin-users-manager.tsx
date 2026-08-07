"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, MailPlus, MoreHorizontal, Search, Shield, UserCheck, UserRoundX, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  deleteAdminUserAction,
  inviteAdminUserAction,
  requestUserEmailChangeAction,
  resendInvitationAction,
  resetUserMfaAction,
  setUserSuspensionAction,
  updateAdminUserAction,
} from "@/features/auth/user-actions";
import type { AdminUser } from "@/features/auth/types";

type PermissionGroup = { readonly module: string; readonly label: string; readonly permissions: readonly { readonly key: string; readonly label: string }[] };
type Mode = "invite" | "edit" | "delete" | null;

function stateOf(user: AdminUser) {
  if (user.suspended_at) return "suspended";
  if (!user.accepted_at) return "pending";
  return "active";
}

function stateLabel(user: AdminUser) {
  const state = stateOf(user);
  return state === "suspended" ? "Suspenso" : state === "pending" ? "Convite pendente" : "Ativo";
}

export function AdminUsersManager({ users, editorDefaults, groups, currentUserId }: { users: AdminUser[]; editorDefaults: string[]; groups: readonly PermissionGroup[]; currentUserId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [mfaFilter, setMfaFilter] = useState("all");
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<"admin" | "editor">("editor");
  const [permissions, setPermissions] = useState<string[]>(editorDefaults);
  const [deleteEmail, setDeleteEmail] = useState("");

  const filtered = useMemo(() => users.filter((user) => {
    const matchesQuery = `${user.name ?? ""} ${user.email}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (stateFilter === "all" || stateOf(user) === stateFilter) && (roleFilter === "all" || user.role === roleFilter) && (mfaFilter === "all" || user.mfaEnabled === (mfaFilter === "enabled"));
  }), [users, query, mfaFilter, roleFilter, stateFilter]);
  const activeCount = users.filter((user) => stateOf(user) === "active").length;
  const pendingCount = users.filter((user) => stateOf(user) === "pending").length;
  const mfaCount = users.filter((user) => user.mfaEnabled).length;
  const metrics = [
    { label: "Total", value: users.length, icon: Users },
    { label: "Ativos", value: activeCount, icon: UserCheck },
    { label: "Convites pendentes", value: pendingCount, icon: MailPlus },
    { label: "Com MFA", value: mfaCount, icon: Shield },
  ];

  function openInvite() { setSelected(null); setRole("editor"); setPermissions(editorDefaults); setMode("invite"); }
  function openEdit(user: AdminUser) { setSelected(user); setRole(user.role); setPermissions(user.role === "admin" ? [] : user.permissions); setMode("edit"); }
  function run(action: (data: FormData) => Promise<{ success: boolean; message: string }>, data: FormData, close = false) {
    startTransition(async () => {
      const result = await action(data);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
      if (result.success) { if (close) setMode(null); router.refresh(); }
    });
  }
  function togglePermission(key: string, checked: boolean) {
    setPermissions((current) => checked ? [...new Set([...current, key])] : current.filter((item) => item !== key));
  }
  function submitInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); data.set("role", role); data.set("permissions", JSON.stringify(permissions)); run(inviteAdminUserAction, data, true);
  }
  function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return; const data = new FormData(event.currentTarget); data.set("id", selected.id); data.set("role", role); data.set("permissions", JSON.stringify(permissions));
    startTransition(async () => {
      const updated = await updateAdminUserAction(data);
      if (!updated.success) { toast.error(updated.message); return; }
      const newEmail = String(data.get("newEmail") || "").trim();
      if (newEmail && newEmail.toLowerCase() !== selected.email.toLowerCase()) {
        const emailData = new FormData(); emailData.set("id", selected.id); emailData.set("newEmail", newEmail);
        const emailResult = await requestUserEmailChangeAction(emailData);
        if (emailResult.success) toast.success(emailResult.message);
        else toast.error(emailResult.message);
      } else toast.success(updated.message);
      setMode(null); router.refresh();
    });
  }

  const matrix = role === "editor" ? <div className="space-y-5">{groups.map((group) => <div key={group.module}><p className="mb-2 text-sm font-bold text-leehov-navy-950">{group.label}</p><div className="grid gap-2 sm:grid-cols-2">{group.permissions.map((permission) => <label key={permission.key} className="flex min-h-10 items-center gap-3 rounded-xl border border-leehov-border px-3 text-sm"><Checkbox checked={permissions.includes(permission.key)} onCheckedChange={(value) => togglePermission(permission.key, value === true)} />{permission.label}</label>)}</div></div>)}</div> : <div className="rounded-xl bg-leehov-surface p-4 text-sm text-leehov-muted">Administradores gerais sempre têm acesso total. As permissões de Usuários são indelegáveis.</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Administração</p><h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950">Usuários e permissões</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-leehov-muted">Convide a equipe, personalize o acesso e proteja contas sem interromper a operação.</p></div><Button type="button" onClick={openInvite} className="rounded-full"><MailPlus className="size-4" />Convidar usuário</Button></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <Card key={label} className="rounded-[18px] border-leehov-border p-5"><Icon className="size-5 text-leehov-blue-600" /><p className="mt-4 text-3xl font-extrabold text-leehov-navy-950">{value}</p><p className="mt-1 text-sm text-leehov-muted">{label}</p></Card>)}</div>
      <Card className="rounded-[20px] border-leehov-border p-5"><div className="grid gap-3 md:grid-cols-[1fr_170px_170px_150px]"><div className="relative"><Search className="absolute left-3 top-3 size-4 text-leehov-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou e-mail" className="pl-9" /></div><Select value={stateFilter} onValueChange={setStateFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os estados</SelectItem><SelectItem value="active">Ativos</SelectItem><SelectItem value="pending">Convite pendente</SelectItem><SelectItem value="suspended">Suspensos</SelectItem></SelectContent></Select><Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os perfis</SelectItem><SelectItem value="admin">Admin geral</SelectItem><SelectItem value="editor">Editor</SelectItem></SelectContent></Select><Select value={mfaFilter} onValueChange={setMfaFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todo MFA</SelectItem><SelectItem value="enabled">Com MFA</SelectItem><SelectItem value="disabled">Sem MFA</SelectItem></SelectContent></Select></div>
        <div className="mt-5 divide-y divide-leehov-border">{filtered.map((user) => <div key={user.id} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold text-leehov-navy-950">{user.name || "Usuário administrativo"}</p><Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role === "admin" ? "Admin geral" : "Editor"}</Badge><Badge variant={stateOf(user) === "active" ? "default" : "outline"}>{stateLabel(user)}</Badge>{user.mfaEnabled ? <Badge variant="outline">MFA</Badge> : null}</div><p className="mt-2 truncate text-sm text-leehov-muted">{user.email}{!user.accepted_at && user.lastEmailStatus ? ` · E-mail: ${user.lastEmailStatus}` : ""}</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => openEdit(user)}><MoreHorizontal className="size-4" />Detalhes</Button>{!user.accepted_at ? <Button type="button" variant="outline" disabled={pending} onClick={() => { const data = new FormData(); data.set("id", user.id); run(resendInvitationAction, data); }}>Reenviar</Button> : null}<Button type="button" variant="outline" disabled={pending || user.id === currentUserId || !user.accepted_at} onClick={() => { const data = new FormData(); data.set("id", user.id); data.set("suspended", String(!user.suspended_at)); run(setUserSuspensionAction, data); }}>{user.suspended_at ? <UserCheck className="size-4" /> : <UserRoundX className="size-4" />}{user.suspended_at ? "Reativar" : "Suspender"}</Button></div></div>)}{!filtered.length ? <p className="py-10 text-center text-sm text-leehov-muted">Nenhum usuário encontrado.</p> : null}</div></Card>

      <Dialog open={mode === "invite"} onOpenChange={(open) => !open && setMode(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Convidar usuário</DialogTitle><DialogDescription>O acesso só será ativado depois que a pessoa definir a senha.</DialogDescription></DialogHeader><form onSubmit={submitInvite} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="invite-name">Nome</Label><Input id="invite-name" name="name" required /></div><div className="space-y-2"><Label htmlFor="invite-email">E-mail</Label><Input id="invite-email" name="email" type="email" required /></div></div><div className="space-y-2"><Label>Perfil</Label><Select value={role} onValueChange={(value) => { setRole(value as "admin" | "editor"); setPermissions(value === "editor" ? editorDefaults : []); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="editor">Editor</SelectItem><SelectItem value="admin">Admin geral</SelectItem></SelectContent></Select></div>{matrix}<DialogFooter><Button type="button" variant="outline" onClick={() => setMode(null)}>Cancelar</Button><Button type="submit" disabled={pending}>{pending ? "Enviando..." : "Criar e enviar convite"}</Button></DialogFooter></form></DialogContent></Dialog>

      <Dialog open={mode === "edit"} onOpenChange={(open) => !open && setMode(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Detalhes e permissões</DialogTitle><DialogDescription>Alterações de acesso valem na próxima requisição do usuário.</DialogDescription></DialogHeader>{selected ? <form onSubmit={submitEdit} className="space-y-6"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="edit-name">Nome</Label><Input id="edit-name" name="name" defaultValue={selected.name ?? ""} required /></div><div className="space-y-2"><Label htmlFor="edit-email">Novo e-mail</Label><Input id="edit-email" name="newEmail" type="email" defaultValue={selected.email} /></div></div><div className="space-y-2"><Label>Perfil</Label><Select value={role} onValueChange={(value) => { setRole(value as "admin" | "editor"); if (value === "editor" && !permissions.length) setPermissions(editorDefaults); }} disabled={selected.id === currentUserId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="editor">Editor</SelectItem><SelectItem value="admin">Admin geral</SelectItem></SelectContent></Select></div>{matrix}<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="font-bold text-amber-950">Área de segurança</p><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={pending || !selected.mfaEnabled} onClick={() => { if (!window.confirm("Remover o MFA deste usuário e revogar suas sessões ativas?")) return; const data = new FormData(); data.set("id", selected.id); run(resetUserMfaAction, data); }}><KeyRound className="size-4" />Redefinir MFA</Button><Button type="button" variant="destructive" disabled={!selected.suspended_at || selected.id === currentUserId} onClick={() => { setDeleteEmail(""); setMode("delete"); }}>Excluir permanentemente</Button></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setMode(null)}>Cancelar</Button><Button type="submit" disabled={pending}>Salvar alterações</Button></DialogFooter></form> : null}</DialogContent></Dialog>

      <Dialog open={mode === "delete"} onOpenChange={(open) => !open && setMode(null)}><DialogContent><DialogHeader><DialogTitle>Excluir usuário permanentemente</DialogTitle><DialogDescription>Esta ação só é permitida para contas suspensas. Digite <strong>{selected?.email}</strong> para confirmar.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="delete-email">E-mail de confirmação</Label><Input id="delete-email" value={deleteEmail} onChange={(event) => setDeleteEmail(event.target.value)} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setMode("edit")}>Voltar</Button><Button type="button" variant="destructive" disabled={pending || deleteEmail.toLowerCase() !== selected?.email.toLowerCase()} onClick={() => { if (!selected) return; const data = new FormData(); data.set("id", selected.id); data.set("confirmationEmail", deleteEmail); run(deleteAdminUserAction, data, true); }}>Excluir definitivamente</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

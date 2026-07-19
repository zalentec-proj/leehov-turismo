"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Cable,
  Home,
  Image,
  Mail,
  Map,
  MessageSquare,
  Plane,
  Settings,
  Star,
  Users,
  LogOut,
  Menu,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { logoutAction } from "@/features/auth/actions";
import type { AdminProfile } from "@/features/auth/types";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/caravanas", label: "Caravanas", icon: Plane },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
  { href: "/admin/leads", label: "Leads", icon: MessageSquare },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/depoimentos", label: "Depoimentos", icon: Star },
  { href: "/admin/popups", label: "Pop-ups", icon: Bell },
  { href: "/admin/midia", label: "Mídia", icon: Image },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, adminOnly: true },
  { href: "/admin/webhooks", label: "Webhooks", icon: Cable, adminOnly: true },
  { href: "/admin/usuarios", label: "Usuários", icon: Users, adminOnly: true },
];

export function AdminShell({ children, profile }: { children: ReactNode; profile: AdminProfile }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || profile.role === "admin");
  const isActive = (href: string) => href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const navigation = (
    <nav className="space-y-1" aria-label="Navegação administrativa">
      {visibleNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leehov-blue-300 motion-reduce:transition-none",
            isActive(item.href) ? "bg-leehov-blue-500 font-bold text-white" : "text-white/72 hover:bg-white/10 hover:text-white",
          )}
        >
          <item.icon className="size-4 shrink-0" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
  return (
    <div className="min-h-screen bg-leehov-surface text-leehov-text">
      <aside className="fixed inset-y-0 left-0 hidden w-[250px] flex-col bg-leehov-navy-950 p-5 text-white lg:flex">
        <Link href="/admin" className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-leehov-blue-500 font-bold">
            L
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em]">Leehov</p>
            <p className="text-xs text-white/55">Admin</p>
          </div>
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">{navigation}</div>
        <div className="mt-auto rounded-[18px] border border-white/10 bg-white/8 p-4">
          <Map className="mb-4 size-6 text-leehov-blue-300" />
          <p className="text-sm font-semibold">Próximo destino</p>
          <p className="mt-2 text-xs leading-5 text-white/60">
            Configure caravanas, leads e conteúdos em um painel simples.
          </p>
        </div>
      </aside>

      <div className="lg:pl-[250px]">
        <header className="flex h-20 items-center justify-between border-b border-leehov-border bg-white px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild><Button type="button" variant="outline" size="icon" className="rounded-full lg:hidden" aria-label="Abrir navegação do painel"><Menu className="size-4" /></Button></SheetTrigger>
              <SheetContent side="left" className="w-[min(88vw,320px)] border-white/10 bg-leehov-navy-950 p-0 text-white" showCloseButton={false}>
                <SheetHeader className="border-b border-white/10 p-6 text-left"><SheetTitle className="text-lg font-extrabold text-white">Leehov Admin</SheetTitle><SheetDescription className="text-white/55">Gestão de conteúdo e atendimento.</SheetDescription></SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto p-4">{navigation}</div>
                <div className="border-t border-white/10 p-5"><p className="font-semibold text-white">{profile.name || profile.email}</p><p className="mt-1 text-xs text-white/55">{profile.role === "admin" ? "Administrador geral" : "Editor"}</p></div>
              </SheetContent>
            </Sheet>
            <div>
            <p className="text-sm text-leehov-muted">Painel administrativo</p>
            <h1 className="text-xl font-bold text-leehov-navy-950">
              Leehov Turismo
            </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-leehov-border bg-white px-4 py-2 text-sm sm:block">
              <p className="font-semibold text-leehov-navy-950">{profile.name || profile.email}</p>
              <p className="text-xs text-leehov-muted">
                {profile.role === "admin" ? "Administrador geral" : "Editor"}
              </p>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="icon" className="rounded-full" aria-label="Sair do painel">
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </header>
        <main className="p-5 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}

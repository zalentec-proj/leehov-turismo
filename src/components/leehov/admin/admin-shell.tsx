import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
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
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/caravanas", label: "Caravanas", icon: Plane },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
  { href: "/admin/leads", label: "Leads", icon: MessageSquare },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/depoimentos", label: "Depoimentos", icon: Star },
  { href: "/admin/popups", label: "Pop-ups", icon: Bell },
  { href: "/admin/midia", label: "Mídia", icon: Image },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
  { href: "/admin/webhooks", label: "Webhooks", icon: Cable },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
];

export function AdminShell({ children }: { children: ReactNode }) {
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
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/72 transition hover:bg-white/10 hover:text-white"
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
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
          <div>
            <p className="text-sm text-leehov-muted">Painel administrativo</p>
            <h1 className="text-xl font-bold text-leehov-navy-950">
              Leehov Turismo
            </h1>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-leehov-border bg-white px-4 py-2 text-sm font-semibold text-leehov-navy-950">
            <BarChart3 className="size-4 text-leehov-blue-500" />
            MVP Setup
          </div>
        </header>
        <main className="p-5 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}

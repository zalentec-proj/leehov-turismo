"use client";

import Link from "next/link";
import { BookOpen, Home, Mail, Plane } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Início", icon: Home, exact: true },
  { href: "/caravanas", label: "Pacotes", icon: Plane },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/contato", label: "Contato", icon: Mail },
] as const;

export function MobileSiteNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação rápida"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-leehov-border/90 bg-white/95 px-2 pb-[calc(0.4rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgb(6_42_68_/_8%)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map((item) => {
          const { href, label, icon: Icon } = item;
          const active = ("exact" in item && item.exact) ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leehov-blue-500 motion-reduce:transition-none",
                active ? "bg-leehov-sky text-leehov-blue-600" : "text-leehov-muted hover:bg-leehov-surface hover:text-leehov-text",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

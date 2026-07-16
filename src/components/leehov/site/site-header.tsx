"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/caravanas", label: "Roteiros", activePath: "/caravanas" },
  { href: "/caravanas", label: "Viagens em Grupo" },
  { href: "/caravanas", label: "Destinos" },
  { href: "/quem-somos", label: "Sobre a Leehov", activePath: "/quem-somos" },
  { href: "/blog", label: "Blog", activePath: "/blog" },
  { href: "/contato", label: "Contato", activePath: "/contato" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const isHome = pathname === "/";
  const hasGlassBackground = isScrolled || !isHome;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        hasGlassBackground
          ? "border-b border-white/10 bg-leehov-navy-950/72 text-white shadow-[0_18px_48px_rgb(6_26_42_/_24%)] backdrop-blur-xl"
          : "bg-gradient-to-b from-leehov-navy-950/28 to-transparent text-white",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-[1313px] items-center justify-between px-5 transition-all duration-300 sm:px-8 xl:px-0",
          hasGlassBackground ? "h-[82px]" : "h-[112px]",
        )}
      >
        <Link href="/" className="flex items-center gap-3" aria-label="Leehov Turismo">
          <span className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center">
            <span className="absolute left-1 top-2 h-7 w-7 rounded-full bg-leehov-blue-600" />
            <span className="absolute bottom-2 right-1 h-7 w-7 rounded-full bg-leehov-blue-300/90" />
            <span className="relative text-base font-extrabold text-white">L</span>
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[24px] font-extrabold uppercase leading-[24px] tracking-normal">
              Leehov
            </span>
            <span
              className={cn(
                "self-end text-[7px] font-bold uppercase tracking-[0.18em] transition-colors",
                hasGlassBackground ? "text-white/75" : "text-white/85",
              )}
            >
              Turismo
            </span>
          </span>
        </Link>

        <nav
          className={cn(
            "hidden items-center gap-[52px] text-[13px] font-bold leading-4 transition-colors lg:flex",
            "text-white",
          )}
        >
          {navItems.map((item) => {
            const isActive =
              item.activePath &&
              (pathname === item.activePath ||
                pathname.startsWith(`${item.activePath}/`));

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "transition hover:text-leehov-blue-500",
                  isActive ? "text-leehov-blue-500" : "text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            asChild
            className="hidden h-[42px] w-[170px] rounded-full bg-gradient-to-r from-leehov-blue-300 to-leehov-blue-600 px-0 text-[12px] font-extrabold leading-4 text-white shadow-[0_10px_22px_rgb(8_117_205_/_28%)] hover:from-leehov-blue-500 hover:to-leehov-blue-600 sm:inline-flex"
          >
            <Link href="/contato">
              <ArrowUpRight className="size-3.5" />
              Fale conosco
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "lg:hidden",
              hasGlassBackground
                ? "text-white hover:bg-white/10 hover:text-white"
                : "text-white hover:bg-white/10 hover:text-white",
            )}
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

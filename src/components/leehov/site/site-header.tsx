"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LEEHOV_WHATSAPP_URL } from "@/features/settings/utils";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/caravanas", label: "Caravanas" },
  { href: "/quem-somos", label: "Quem Somos" },
  { href: "/blog", label: "Blog" },
  { href: "/contato", label: "Contato" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isHome = pathname === "/";
  const hasGlassBackground = isScrolled || !isHome;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function isItemActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

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
        <Link href="/" className="block shrink-0" aria-label="Leehov Turismo">
          <Image
            src="/images/leehov/logo-site.webp"
            alt="Leehov Turismo"
            width={500}
            height={158}
            priority
            unoptimized
            sizes="(min-width: 640px) 194px, 170px"
            className="h-auto w-[170px] sm:w-[194px]"
          />
        </Link>

        <nav
          className={cn(
            "hidden items-center gap-[52px] text-[13px] font-bold leading-4 transition-colors lg:flex",
            "text-white",
          )}
        >
          {navItems.map((item) => {
            const isActive = isItemActive(item.href);

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
            <a href={LEEHOV_WHATSAPP_URL} target="_blank" rel="noreferrer">
              <ArrowUpRight className="size-3.5" />
              Fale conosco
            </a>
          </Button>
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white lg:hidden" aria-label="Abrir menu principal" aria-expanded={isMenuOpen}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[min(88vw,390px)] border-white/10 bg-leehov-navy-950 p-0 text-white" showCloseButton={false}>
              <SheetHeader className="border-b border-white/10 px-6 py-7 text-left">
                <SheetTitle className="text-xl font-extrabold text-white">Leehov Turismo</SheetTitle>
                <SheetDescription className="text-white/58">Caravanas e viagens em grupo acompanhadas.</SheetDescription>
              </SheetHeader>
              <nav aria-label="Menu principal" className="flex flex-col gap-2 px-4 py-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isItemActive(item.href) ? "page" : undefined}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "rounded-xl px-4 py-4 text-base font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leehov-blue-300 motion-reduce:transition-none",
                      isItemActive(item.href) ? "bg-leehov-blue-500 text-white" : "text-white/74 hover:bg-white/8 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <SheetFooter className="border-t border-white/10 p-6">
                <Button asChild size="lg" className="w-full rounded-full bg-gradient-to-r from-leehov-blue-300 to-leehov-blue-600 text-white">
                  <a href={LEEHOV_WHATSAPP_URL} target="_blank" rel="noreferrer" onClick={() => setIsMenuOpen(false)}><ArrowUpRight className="size-4" />Fale conosco</a>
                </Button>
                <Button type="button" variant="ghost" className="mt-2 w-full text-white/70 hover:bg-white/8 hover:text-white" onClick={() => setIsMenuOpen(false)}>Fechar menu</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

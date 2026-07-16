import type { ReactNode } from "react";
import { SiteFooter } from "@/components/leehov/site/site-footer";
import { SiteHeader } from "@/components/leehov/site/site-header";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-leehov-text">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

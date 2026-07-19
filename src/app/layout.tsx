import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { getPublicSiteSettings } from "@/features/settings/queries";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: { default: settings.seo.siteName, template: settings.seo.titleTemplate },
    description: settings.seo.defaultDescription,
    openGraph: { siteName: settings.seo.siteName, description: settings.seo.defaultDescription, images: settings.seo.ogImageUrl ? [{ url: settings.seo.ogImageUrl }] : undefined },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full" data-scroll-behavior="smooth">
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          {children}
          <Toaster richColors closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}

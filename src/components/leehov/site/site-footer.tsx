import Image from "next/image";
import Link from "next/link";
import { Camera, Globe2, Mail, MapPin, MessageCircle } from "lucide-react";
import { NewsletterSignup } from "@/features/newsletter/components/newsletter-signup";
import type { PublicSiteSettings } from "@/features/settings/types";
import { LEEHOV_WHATSAPP_DISPLAY, LEEHOV_WHATSAPP_URL } from "@/features/settings/utils";

const footerColumns = [
  {
    title: "A Leehov",
    links: [
      { href: "/quem-somos", label: "Quem Somos" },
      { href: "/caravanas", label: "Caravanas" },
      { href: "/blog", label: "Inspirações de viagem" },
    ],
  },
  {
    title: "Atendimento",
    links: [
      { href: "/contato", label: "Contato" },
      { href: "/politica-de-privacidade", label: "Política de Privacidade" },
    ],
  },
];

export function SiteFooter({ settings }: { settings: PublicSiteSettings }) {
  const socialLinks = [{ href: settings.social.instagram, icon: Camera, label: "Instagram" }, { href: settings.social.facebook, icon: Globe2, label: "Facebook" }, { href: settings.social.youtube, icon: MessageCircle, label: "YouTube" }].filter((item) => item.href);
  return (
    <footer className="bg-leehov-navy-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_1fr_1fr] lg:px-12">
        <div>
          <Link href="/" className="mb-5 block" aria-label="Leehov Turismo">
            <Image src="/images/leehov/logo-site.webp" alt="Leehov Turismo" width={500} height={158} unoptimized sizes="176px" className="h-auto w-[176px]" />
          </Link>
          <p className="max-w-sm text-sm leading-7 text-white/70">
            Caravanas e viagens em grupo acompanhadas, com atendimento humano,
            roteiros planejados e suporte em cada etapa da experiência.
          </p>
          {socialLinks.length ? <div className="mt-6 flex gap-3 text-white/75">{socialLinks.map((item) => <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} className="transition hover:text-white"><item.icon className="size-5" /></a>)}</div> : null}
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-leehov-blue-300">
              {column.title}
            </h2>
            <ul className="space-y-3 text-sm text-white/70">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-leehov-blue-300">
            Contato
          </h2>
          <div className="space-y-3 text-sm text-white/70">
            <a href={LEEHOV_WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex gap-3 transition hover:text-white">
              <MessageCircle className="mt-0.5 size-4 shrink-0" />
              {LEEHOV_WHATSAPP_DISPLAY}
            </a>
            {settings.contact.contactEmail ? <a href={`mailto:${settings.contact.contactEmail}`} className="flex gap-3 transition hover:text-white">
              <Mail className="mt-0.5 size-4 shrink-0" />
              {settings.contact.contactEmail}
            </a> : null}
            {settings.contact.address ? <p className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              {settings.contact.address}
            </p> : null}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-[1fr_520px] md:items-center"><div><p className="text-sm font-bold text-white">Novidades da Leehov no seu e-mail</p><p className="mt-2 text-sm text-white/60">Confirmação segura e cancelamento a qualquer momento.</p></div><NewsletterSignup source="footer" variant="dark" /></div></div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/50">
        © 2026 Leehov Turismo. Todos os direitos reservados.
      </div>
    </footer>
  );
}

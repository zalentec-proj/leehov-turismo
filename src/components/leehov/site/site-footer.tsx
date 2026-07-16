import Link from "next/link";
import { Camera, Globe2, Mail, MapPin, MessageCircle } from "lucide-react";

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

export function SiteFooter() {
  return (
    <footer className="bg-leehov-navy-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_1fr_1fr] lg:px-12">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-leehov-blue-500 font-bold">
              L
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.18em]">
              Leehov Turismo
            </span>
          </div>
          <p className="max-w-sm text-sm leading-7 text-white/70">
            Caravanas e viagens em grupo acompanhadas, com atendimento humano,
            roteiros planejados e suporte em cada etapa da experiência.
          </p>
          <div className="mt-6 flex gap-3 text-white/75">
            <Camera className="size-5" />
            <Globe2 className="size-5" />
            <MessageCircle className="size-5" />
          </div>
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
            <p className="flex gap-3">
              <MessageCircle className="mt-0.5 size-4 shrink-0" />
              WhatsApp principal a configurar
            </p>
            <p className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0" />
              contato@leehovturismo.com.br
            </p>
            <p className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              Dados completos serão definidos nas configurações do admin.
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/50">
        © 2026 Leehov Turismo. Todos os direitos reservados.
      </div>
    </footer>
  );
}

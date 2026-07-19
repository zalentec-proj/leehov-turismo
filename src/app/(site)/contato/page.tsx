import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/leehov/shared/section-heading";
import { ContactForm } from "@/features/leads/components/contact-form";
import { getPublicSiteSettings } from "@/features/settings/queries";
import { LEEHOV_WHATSAPP_DISPLAY, LEEHOV_WHATSAPP_URL } from "@/features/settings/utils";

export const metadata = {
  title: "Contato",
  alternates: { canonical: "/contato" },
};

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();
  return (
    <main className="bg-leehov-surface pb-24">
      <section className="bg-leehov-navy-950 px-5 pb-28 pt-40 text-white sm:px-8 lg:px-12"><div className="mx-auto max-w-[1312px]"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-300">Atendimento Leehov</p><h1 className="mt-5 text-4xl font-extrabold sm:text-[58px]">Vamos planejar sua próxima viagem?</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">Converse com quem entende de caravanas e viagens em grupo acompanhadas.</p></div></section>
      <section className="px-5 pt-16 sm:px-8 lg:px-12"><div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.78fr_1.22fr]">
        <div>
          <SectionHeading
            eyebrow="Fale com a Leehov"
            title="Converse com nossa equipe"
            description="Conte como podemos ajudar. Sua mensagem fica registrada para que nossa equipe acompanhe o atendimento."
          />
          <div className="space-y-3 text-sm text-leehov-text">
            <a href={LEEHOV_WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex gap-3 rounded-xl bg-white p-4 transition hover:text-leehov-blue-600 motion-reduce:transition-none"><MessageCircle className="size-5 shrink-0 text-leehov-blue-500" />{LEEHOV_WHATSAPP_DISPLAY}</a>
            {settings.contact.contactEmail ? <a href={`mailto:${settings.contact.contactEmail}`} className="flex gap-3 rounded-xl bg-white p-4 transition hover:text-leehov-blue-600 motion-reduce:transition-none"><Mail className="size-5 shrink-0 text-leehov-blue-500" />{settings.contact.contactEmail}</a> : null}
            {settings.contact.address ? <p className="flex gap-3 rounded-xl bg-white p-4"><MapPin className="size-5 shrink-0 text-leehov-blue-500" />{settings.contact.address}</p> : null}
          </div>
        </div>
        <Card className="rounded-[24px] border-leehov-border p-6 shadow-leehov-card sm:p-8">
          <ContactForm />
        </Card>
      </div></section>
    </main>
  );
}

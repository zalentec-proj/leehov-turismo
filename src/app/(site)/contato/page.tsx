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
      <section className="bg-leehov-navy-950 px-10 pb-16 pt-28 text-white sm:px-8 sm:pb-28 sm:pt-40 lg:px-12"><div className="mx-auto max-w-[1312px]"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leehov-blue-300">Atendimento Leehov</p><h1 className="mt-4 text-[36px] font-extrabold leading-tight sm:mt-5 sm:text-[58px]">Vamos planejar sua próxima viagem?</h1><p className="mt-4 max-w-2xl text-[15px] leading-6 text-white/68 sm:mt-6 sm:text-lg sm:leading-8">Converse com quem entende de pacotes e viagens em grupo acompanhadas.</p></div></section>
      <section className="px-10 pt-16 sm:px-8 lg:px-12"><div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.78fr_1.22fr]">
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
        <Card className="min-w-0 rounded-[20px] border-leehov-border p-5 shadow-leehov-card sm:rounded-[24px] sm:p-8">
          <ContactForm />
        </Card>
      </div></section>
    </main>
  );
}

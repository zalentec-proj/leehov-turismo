import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/leehov/shared/section-heading";

export const metadata = {
  title: "Contato",
};

export default function ContactPage() {
  return (
    <section className="bg-leehov-surface px-5 pb-20 pt-40 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading
            eyebrow="Fale com a Leehov"
            title="Converse com nossa equipe"
            description="Formulario preparado para salvar leads no Supabase, validar Turnstile e enviar notificacoes via Resend."
          />
          <div className="space-y-4 text-sm text-leehov-text">
            <p className="flex gap-3"><MessageCircle className="size-5 text-leehov-blue-500" /> WhatsApp a configurar no admin</p>
            <p className="flex gap-3"><Mail className="size-5 text-leehov-blue-500" /> contato@leehovturismo.com.br</p>
            <p className="flex gap-3"><MapPin className="size-5 text-leehov-blue-500" /> Endereco sera definido nas configuracoes.</p>
          </div>
        </div>
        <Card className="rounded-[24px] border-leehov-border p-6 shadow-leehov-card">
          <form className="grid gap-4">
            <Input name="name" placeholder="Nome" />
            <Input name="email" placeholder="E-mail" type="email" />
            <Input name="phone" placeholder="WhatsApp" />
            <Textarea name="message" placeholder="Como podemos ajudar?" rows={6} />
            <Button type="button" className="rounded-full bg-leehov-blue-600 text-white hover:bg-leehov-cyan">
              Enviar mensagem
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
}

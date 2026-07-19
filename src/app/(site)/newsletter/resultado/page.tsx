import Link from "next/link";
import { CircleCheck, Clock3, MailX, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const states = {
  confirmed: {
    icon: CircleCheck,
    title: "Inscrição confirmada",
    description: "Boas-vindas à lista da Leehov. Você receberá novidades, inspirações e caravanas em seu e-mail.",
  },
  expired: {
    icon: Clock3,
    title: "Link expirado",
    description: "O link de confirmação é válido por 24 horas. Faça uma nova inscrição para receber outro link.",
  },
  unsubscribed: {
    icon: MailX,
    title: "Inscrição cancelada",
    description: "Seu e-mail não receberá mais as novidades da Leehov. Você poderá se inscrever novamente quando quiser.",
  },
  invalid: {
    icon: TriangleAlert,
    title: "Link inválido",
    description: "Este link já foi utilizado ou não é válido. Se precisar, faça uma nova inscrição.",
  },
} as const;

export const metadata = { title: "Newsletter" };

export default async function NewsletterResultPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const state = states[status as keyof typeof states] ?? states.invalid;
  const Icon = state.icon;

  return (
    <section className="bg-leehov-surface px-5 pb-24 pt-40 sm:px-8 lg:px-12">
      <Card className="mx-auto max-w-2xl rounded-[28px] border-leehov-border p-8 text-center shadow-leehov-floating sm:p-12">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-leehov-blue-500/10 text-leehov-blue-600">
          <Icon className="size-8" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold text-leehov-navy-950">{state.title}</h1>
        <p className="mx-auto mt-4 max-w-lg leading-7 text-leehov-muted">{state.description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full bg-leehov-blue-600 text-white"><Link href="/">Voltar ao início</Link></Button>
          <Button asChild variant="outline" className="rounded-full"><Link href="/caravanas">Conhecer caravanas</Link></Button>
        </div>
      </Card>
    </section>
  );
}

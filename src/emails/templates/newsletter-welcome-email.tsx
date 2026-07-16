import { EmailLayout } from "@/emails/components/email-layout";

export function NewsletterWelcomeEmail({ name = "viajante" }: { name?: string }) {
  return (
    <EmailLayout>
      <h1 style={{ color: "#062A44", fontSize: "28px", margin: "0 0 16px" }}>
        Voce esta na lista da Leehov Turismo
      </h1>
      <p style={{ fontSize: "16px", lineHeight: "26px", margin: 0 }}>
        Ola, {name}. Sua inscricao foi confirmada. Em breve voce recebera
        inspiracoes de viagem, novas caravanas e orientacoes da equipe Leehov.
      </p>
    </EmailLayout>
  );
}

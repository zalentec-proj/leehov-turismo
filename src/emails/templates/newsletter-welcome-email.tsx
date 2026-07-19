import { EmailLayout } from "@/emails/components/email-layout";
import { EmailButton } from "@/emails/components/email-button";

export function NewsletterWelcomeEmail({ name = "viajante", caravansUrl, unsubscribeUrl }: { name?: string; caravansUrl: string; unsubscribeUrl: string }) {
  return (
    <EmailLayout preview="Você está na lista da Leehov Turismo">
      <h1 style={{ color: "#062A44", fontSize: "28px", margin: "0 0 16px" }}>
        Você está na lista da Leehov Turismo
      </h1>
      <p style={{ fontSize: "16px", lineHeight: "26px", margin: 0 }}>
        Olá, {name}. Sua inscrição foi confirmada. Em breve você receberá inspirações de viagem, novas caravanas e orientações da equipe Leehov.
      </p>
      <EmailButton href={caravansUrl}>Conhecer caravanas</EmailButton>
      <p style={{ color: "#5F6F84", fontSize: "12px", lineHeight: "19px", marginTop: "24px" }}>
        Não quer mais receber? <a href={unsubscribeUrl} style={{ color: "#0077C8" }}>Cancelar inscrição</a>.
      </p>
    </EmailLayout>
  );
}

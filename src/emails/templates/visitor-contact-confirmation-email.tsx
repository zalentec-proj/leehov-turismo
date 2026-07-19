import { EmailLayout } from "@/emails/components/email-layout";
import { EmailButton } from "@/emails/components/email-button";

export function VisitorContactConfirmationEmail(props: { name: string; whatsappUrl?: string }) {
  return (
    <EmailLayout preview="Recebemos sua mensagem">
      <h1 style={{ color: "#062A44", fontSize: "28px", margin: "0 0 16px" }}>Recebemos sua mensagem</h1>
      <p style={{ fontSize: "16px", lineHeight: "26px", margin: 0 }}>
        Olá, {props.name}. Seus dados foram recebidos e a equipe Leehov responderá assim que possível.
      </p>
      {props.whatsappUrl ? <EmailButton href={props.whatsappUrl}>Falar com a Leehov no WhatsApp</EmailButton> : null}
    </EmailLayout>
  );
}

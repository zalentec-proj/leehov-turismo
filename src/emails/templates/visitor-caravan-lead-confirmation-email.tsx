import { EmailLayout } from "@/emails/components/email-layout";
import { EmailButton } from "@/emails/components/email-button";

export function VisitorCaravanLeadConfirmationEmail(props: { name: string; caravanTitle: string; caravanUrl: string; whatsappUrl?: string }) {
  return (
    <EmailLayout preview={`Recebemos seu interesse em ${props.caravanTitle}`}>
      <h1 style={{ color: "#062A44", fontSize: "28px", margin: "0 0 16px" }}>Recebemos seu interesse</h1>
      <p style={{ fontSize: "16px", lineHeight: "26px", margin: 0 }}>
        Olá, {props.name}. A equipe Leehov recebeu seu interesse na caravana <strong>{props.caravanTitle}</strong> e entrará em contato para orientar os próximos passos.
      </p>
      <EmailButton href={props.whatsappUrl || props.caravanUrl}>{props.whatsappUrl ? "Conversar no WhatsApp" : "Rever a caravana"}</EmailButton>
    </EmailLayout>
  );
}

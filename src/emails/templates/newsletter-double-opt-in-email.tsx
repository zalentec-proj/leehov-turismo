import { EmailLayout } from "@/emails/components/email-layout";
import { EmailButton } from "@/emails/components/email-button";

export function NewsletterDoubleOptInEmail(props: { name?: string; confirmationUrl: string }) {
  return (
    <EmailLayout preview="Confirme sua inscrição na Leehov Turismo">
      <h1 style={{ color: "#062A44", fontSize: "28px", margin: "0 0 16px" }}>Confirme sua inscrição</h1>
      <p style={{ fontSize: "16px", lineHeight: "26px", margin: 0 }}>
        {props.name ? `Olá, ${props.name}. ` : ""}Confirme seu e-mail para receber inspirações, novidades e caravanas da Leehov Turismo. O link é válido por 24 horas.
      </p>
      <EmailButton href={props.confirmationUrl}>Confirmar inscrição</EmailButton>
      <p style={{ color: "#5F6F84", fontSize: "12px", lineHeight: "19px", marginTop: "20px", wordBreak: "break-all" }}>
        Se o botão não funcionar, acesse: {props.confirmationUrl}
      </p>
    </EmailLayout>
  );
}

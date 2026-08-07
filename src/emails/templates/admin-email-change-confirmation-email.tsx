import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";

export function AdminEmailChangeConfirmationEmail({ name, confirmationUrl }: { name: string; confirmationUrl: string }) {
  return (
    <EmailLayout preview="Confirme seu novo e-mail administrativo">
      <h1 style={{ color: "#062A44", fontSize: "28px", margin: "0 0 16px" }}>Confirme seu novo e-mail</h1>
      <p style={{ fontSize: "15px", lineHeight: "24px" }}>Olá, {name}. Confirme este endereço para concluir a alteração do seu acesso à Leehov.</p>
      <EmailButton href={confirmationUrl}>Confirmar novo e-mail</EmailButton>
      <p style={{ color: "#5F6F84", fontSize: "12px", lineHeight: "20px", marginTop: "24px" }}>O endereço atual continuará válido até a confirmação. O link expira em 24 horas.</p>
    </EmailLayout>
  );
}

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";

export function AdminPasswordRecoveryEmail({ name, recoveryUrl }: { name: string; recoveryUrl: string }) {
  return (
    <EmailLayout preview="Redefina sua senha do painel Leehov">
      <h1 style={{ color: "#062A44", fontSize: "28px", margin: "0 0 16px" }}>Redefinição de senha</h1>
      <p style={{ fontSize: "15px", lineHeight: "24px" }}>Olá, {name}. Recebemos uma solicitação para redefinir a senha do seu acesso administrativo.</p>
      <EmailButton href={recoveryUrl}>Criar nova senha</EmailButton>
      <p style={{ color: "#5F6F84", fontSize: "12px", lineHeight: "20px", marginTop: "24px" }}>O link expira em 24 horas. Se não foi você, ignore esta mensagem e sua senha continuará a mesma.</p>
    </EmailLayout>
  );
}

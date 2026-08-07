import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";

export function AdminUserInviteEmail({ name, inviteUrl, expiresInHours = 24 }: { name: string; inviteUrl: string; expiresInHours?: number }) {
  return (
    <EmailLayout preview="Você foi convidado para o painel da Leehov Turismo">
      <h1 style={{ color: "#062A44", fontSize: "28px", margin: "0 0 16px" }}>Seu acesso à Leehov está pronto</h1>
      <p style={{ fontSize: "15px", lineHeight: "24px" }}>Olá, {name}. Você foi convidado para colaborar no painel administrativo da Leehov Turismo.</p>
      <p style={{ fontSize: "15px", lineHeight: "24px" }}>Confirme seu acesso e defina uma senha. Este link é pessoal, pode ser usado uma única vez e expira em {expiresInHours} horas.</p>
      <EmailButton href={inviteUrl}>Aceitar convite</EmailButton>
      <p style={{ color: "#5F6F84", fontSize: "12px", lineHeight: "20px", marginTop: "24px" }}>Se você não esperava este convite, ignore esta mensagem.</p>
    </EmailLayout>
  );
}

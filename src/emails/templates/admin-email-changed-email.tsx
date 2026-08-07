import { EmailLayout } from "@/emails/components/email-layout";

export function AdminEmailChangedEmail({ name, newEmail }: { name: string; newEmail: string }) {
  return (
    <EmailLayout preview="O e-mail do seu acesso Leehov foi alterado">
      <h1 style={{ color: "#062A44", fontSize: "28px", margin: "0 0 16px" }}>E-mail de acesso alterado</h1>
      <p style={{ fontSize: "15px", lineHeight: "24px" }}>Olá, {name}. O e-mail do seu acesso administrativo foi alterado para <strong>{newEmail}</strong>.</p>
      <p style={{ color: "#5F6F84", fontSize: "13px", lineHeight: "21px" }}>Se você não reconhece esta alteração, entre em contato imediatamente com a administração da Leehov.</p>
    </EmailLayout>
  );
}

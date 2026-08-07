import { EmailLayout } from "@/emails/components/email-layout";

export function AdminAccessChangedEmail({ name, role }: { name: string; role: "admin" | "editor" }) {
  return (
    <EmailLayout preview="Seu acesso ao painel Leehov foi atualizado">
      <h1 style={{ color: "#062A44", fontSize: "28px", margin: "0 0 16px" }}>Acesso atualizado</h1>
      <p style={{ fontSize: "15px", lineHeight: "24px" }}>Olá, {name}. Um administrador atualizou seu acesso ao painel da Leehov Turismo.</p>
      <p style={{ fontSize: "15px", lineHeight: "24px" }}>Seu perfil atual é <strong>{role === "admin" ? "Administrador geral" : "Editor"}</strong>. As novas permissões valem já na próxima navegação ou ação.</p>
      <p style={{ color: "#5F6F84", fontSize: "12px", lineHeight: "20px", marginTop: "24px" }}>Se você não reconhece esta alteração, fale com o administrador geral.</p>
    </EmailLayout>
  );
}

import { EmailLayout } from "@/emails/components/email-layout";
import { EmailButton } from "@/emails/components/email-button";

export function AdminCaravanLeadEmail(props: {
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  message: string;
  caravanTitle: string;
  adminUrl: string;
}) {
  return (
    <EmailLayout preview={`Novo interesse em ${props.caravanTitle}`}>
      <h1 style={{ color: "#062A44", fontSize: "28px", margin: "0 0 16px" }}>Novo interesse em caravana</h1>
      <p style={{ lineHeight: "25px" }}><strong>Caravana:</strong> {props.caravanTitle}</p>
      <p style={{ lineHeight: "25px" }}><strong>Nome:</strong> {props.name}</p>
      <p style={{ lineHeight: "25px" }}><strong>E-mail:</strong> {props.email}</p>
      <p style={{ lineHeight: "25px" }}><strong>WhatsApp:</strong> {props.phone}</p>
      <p style={{ lineHeight: "25px" }}><strong>Cidade/estado:</strong> {props.city}/{props.state}</p>
      <p style={{ lineHeight: "25px" }}><strong>Mensagem:</strong><br />{props.message}</p>
      <EmailButton href={props.adminUrl}>Abrir lead no painel</EmailButton>
    </EmailLayout>
  );
}

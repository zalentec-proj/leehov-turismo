import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";
import type { NewsletterCampaignBlock } from "@/features/newsletter/types";

/* eslint-disable @next/next/no-img-element -- HTML de e-mail precisa de URL absoluta e não suporta next/image. */

export function NewsletterCampaignEmail({ preheader, blocks, unsubscribeUrl }: { preheader?: string; blocks: NewsletterCampaignBlock[]; unsubscribeUrl: string }) {
  return <EmailLayout preview={preheader}>{blocks.map((block) => {
    if (block.type === "heading") return <h2 key={block.id} style={{ color: "#062A44", fontSize: block.data.level === 1 ? "30px" : block.data.level === 3 ? "20px" : "25px", lineHeight: 1.25, margin: "20px 0 12px" }}>{block.data.text}</h2>;
    if (block.type === "paragraph") return <p key={block.id} style={{ color: "#334A62", fontSize: "16px", lineHeight: "26px", margin: "0 0 16px", whiteSpace: "pre-wrap" }}>{block.data.text}</p>;
    if (block.type === "image" && block.data.url) return <img key={block.id} src={block.data.url} alt={block.data.alt || ""} width="576" style={{ borderRadius: "14px", display: "block", height: "auto", margin: "20px 0", maxWidth: "100%", width: "100%" }} />;
    if (block.type === "button" && block.data.url) return <EmailButton key={block.id} href={block.data.url}>{block.data.label || "Saiba mais"}</EmailButton>;
    if (block.type === "divider") return <hr key={block.id} style={{ border: 0, borderTop: "1px solid #DDEAF5", margin: "24px 0" }} />;
    if (block.type === "spacer") return <div key={block.id} style={{ height: `${block.data.height || 24}px` }} />;
    return null;
  })}<p style={{ color: "#5F6F84", fontSize: "12px", lineHeight: "19px", marginTop: "28px" }}>Não quer mais receber? <a href={unsubscribeUrl} style={{ color: "#0077C8" }}>Cancelar inscrição</a>.</p></EmailLayout>;
}

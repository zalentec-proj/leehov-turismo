import type { ReactNode } from "react";

export function EmailLayout({ children, preview }: { children: ReactNode; preview?: string }) {
  return (
    <div
      style={{
        backgroundColor: "#F3FAFF",
        color: "#0B1F3A",
        fontFamily: "Inter, Arial, sans-serif",
        padding: "32px",
      }}
    >
      {preview ? <span style={{ display: "none", maxHeight: 0, overflow: "hidden" }}>{preview}</span> : null}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #DDEAF5",
          borderRadius: "18px",
          margin: "0 auto",
          maxWidth: "640px",
          padding: "32px",
        }}
      >
        <p style={{ color: "#00AEEF", fontSize: "12px", fontWeight: 800, letterSpacing: "1.5px", margin: "0 0 20px", textTransform: "uppercase" }}>
          Leehov Turismo
        </p>
        {children}
        <p style={{ borderTop: "1px solid #DDEAF5", color: "#5F6F84", fontSize: "12px", lineHeight: "20px", margin: "28px 0 0", paddingTop: "20px" }}>
          Caravanas e viagens em grupo acompanhadas, com suporte antes, durante e depois da viagem.
        </p>
      </div>
    </div>
  );
}

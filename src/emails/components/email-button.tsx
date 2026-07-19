import type { ReactNode } from "react";

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      style={{
        backgroundColor: "#0077C8",
        borderRadius: "999px",
        color: "#FFFFFF",
        display: "inline-block",
        fontSize: "14px",
        fontWeight: 700,
        marginTop: "20px",
        padding: "13px 22px",
        textDecoration: "none",
      }}
    >
      {children}
    </a>
  );
}

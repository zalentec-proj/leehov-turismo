import type { ReactNode } from "react";

export function EmailLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "#F3FAFF",
        color: "#0B1F3A",
        fontFamily: "Inter, Arial, sans-serif",
        padding: "32px",
      }}
    >
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
        {children}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { eraseBrowserMeasurement } from "../client";

export function EraseMeasurement() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <div className="space-y-2">
    <Button type="button" variant="outline" disabled={busy} onClick={async () => {
      setBusy(true);
      try {
        const result = await eraseBrowserMeasurement();
        setMessage(result ? "Dados de medição deste navegador excluídos." : "Não há dados de medição associados a este navegador.");
      } catch {
        setMessage("Não foi possível excluir agora. Tente novamente.");
      } finally {
        setBusy(false);
      }
    }}>Apagar dados de medição deste navegador</Button>
    {message && <p className="text-sm" role="status">{message}</p>}
  </div>;
}

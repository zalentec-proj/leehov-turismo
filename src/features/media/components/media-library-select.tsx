"use client";

import Image from "next/image";
import { Check, ImageIcon, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MediaAsset } from "@/features/media/types";
import { mediaFolders } from "@/features/media/types";

const folderLabels: Record<string, string> = { general: "Geral", packages: "Pacotes", blog: "Blog", testimonials: "Depoimentos", popups: "Pop-ups", seo: "SEO", home: "Home" };

export function MediaLibrarySelect({ open, onOpenChange, assets, title = "Selecionar da Biblioteca de Mídia", onSelect }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: MediaAsset[];
  title?: string;
  onSelect: (asset: MediaAsset) => void;
}) {
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("all");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return assets.filter((asset) => (folder === "all" || asset.folder === folder) && (!normalized || `${asset.fileName} ${asset.altText} ${asset.caption} ${asset.sourceLabel} ${asset.tags.join(" ")}`.toLocaleLowerCase("pt-BR").includes(normalized)));
  }, [assets, folder, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-5xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Reutilize uma imagem já armazenada, sem criar uma cópia no Storage.</DialogDescription></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-leehov-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Buscar por arquivo, origem ou tag" /></div>
          <Select value={folder} onValueChange={setFolder}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as pastas</SelectItem>{mediaFolders.map((item) => <SelectItem key={item} value={item}>{folderLabels[item]}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="grid max-h-[62vh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((asset) => (
            <button key={asset.id} type="button" className="group overflow-hidden rounded-2xl border border-leehov-border bg-white text-left transition hover:border-leehov-blue-500 hover:shadow-md" onClick={() => { onSelect(asset); onOpenChange(false); }}>
              <div className="relative aspect-[4/3] bg-leehov-surface">{asset.signedUrl ? <Image src={asset.signedUrl} alt={asset.altText || asset.fileName} fill sizes="280px" className="object-cover" /> : <ImageIcon className="absolute inset-0 m-auto size-7 text-leehov-muted" />}<span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-leehov-blue-700 opacity-0 shadow transition group-hover:opacity-100"><Check className="size-4" /></span></div>
              <div className="space-y-1 p-3"><p className="truncate text-sm font-bold text-leehov-navy-950">{asset.fileName}</p><p className="truncate text-xs text-leehov-muted">{asset.sourceLabel || folderLabels[asset.folder] || "Biblioteca"}</p>{asset.tags.length ? <p className="truncate text-[11px] text-leehov-blue-700">{asset.tags.join(" · ")}</p> : null}</div>
            </button>
          ))}
          {!filtered.length ? <div className="col-span-full rounded-2xl border border-dashed border-leehov-border p-10 text-center text-sm text-leehov-muted">Nenhuma imagem encontrada.</div> : null}
        </div>
        <div className="flex justify-end"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button></div>
      </DialogContent>
    </Dialog>
  );
}

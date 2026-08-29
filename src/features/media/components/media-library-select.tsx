"use client";

import Image from "next/image";
import { Check, ImageIcon, Search } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MediaAsset } from "@/features/media/types";
import { mediaFolders } from "@/features/media/types";
import { getMediaPreviewUrlsAction } from "@/features/media/actions";

const folderLabels: Record<string, string> = { general: "Geral", packages: "Pacotes", blog: "Blog", testimonials: "Depoimentos", popups: "Pop-ups", seo: "SEO", home: "Home" };
const PREVIEW_BATCH_SIZE = 15;

export function MediaLibrarySelect({ open, onOpenChange, assets, title = "Selecionar da Biblioteca de Mídia", onSelect }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: MediaAsset[];
  title?: string;
  onSelect: (asset: MediaAsset) => void;
}) {
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PREVIEW_BATCH_SIZE);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [, startPreviewTransition] = useTransition();
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return assets.filter((asset) => (folder === "all" || asset.folder === folder) && (!normalized || `${asset.fileName} ${asset.altText} ${asset.caption} ${asset.sourceLabel} ${asset.tags.join(" ")}`.toLocaleLowerCase("pt-BR").includes(normalized)));
  }, [assets, folder, query]);

  const previewAssets = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  useEffect(() => {
    if (!open) return;
    const ids = previewAssets.filter((asset) => !asset.signedUrl && !previewUrls[asset.id]).map((asset) => asset.id);
    if (!ids.length) return;
    startPreviewTransition(async () => {
      const result = await getMediaPreviewUrlsAction(ids);
      if (result.success) setPreviewUrls((current) => ({ ...current, ...result.urls }));
    });
  }, [open, previewAssets, previewUrls, startPreviewTransition]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-5xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Reutilize uma imagem já armazenada, sem criar uma cópia no Storage.</DialogDescription></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-leehov-muted" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(PREVIEW_BATCH_SIZE); }} className="pl-9" placeholder="Buscar por arquivo, origem ou tag" /></div>
          <Select value={folder} onValueChange={(value) => { setFolder(value); setVisibleCount(PREVIEW_BATCH_SIZE); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as pastas</SelectItem>{mediaFolders.map((item) => <SelectItem key={item} value={item}>{folderLabels[item]}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="grid max-h-[62vh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {previewAssets.map((asset) => {
            const signedUrl = previewUrls[asset.id] ?? asset.signedUrl;
            return (
            <button key={asset.id} type="button" className="group overflow-hidden rounded-2xl border border-leehov-border bg-white text-left transition hover:border-leehov-blue-500 hover:shadow-md" onClick={() => { onSelect(asset); onOpenChange(false); }}>
              <div className="relative aspect-[4/3] bg-leehov-surface">{signedUrl ? <Image src={signedUrl} alt={asset.altText || asset.fileName} fill quality={78} sizes="280px" className="object-cover" /> : <ImageIcon className="absolute inset-0 m-auto size-7 text-leehov-muted" />}<span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-leehov-blue-700 opacity-0 shadow transition group-hover:opacity-100"><Check className="size-4" /></span></div>
              <div className="space-y-1 p-3"><p className="truncate text-sm font-bold text-leehov-navy-950">{asset.fileName}</p><p className="truncate text-xs text-leehov-muted">{asset.sourceLabel || folderLabels[asset.folder] || "Biblioteca"}</p>{asset.tags.length ? <p className="truncate text-[11px] text-leehov-blue-700">{asset.tags.join(" · ")}</p> : null}</div>
            </button>
            );
          })}
          {!filtered.length ? <div className="col-span-full rounded-2xl border border-dashed border-leehov-border p-10 text-center text-sm text-leehov-muted">Nenhuma imagem encontrada.</div> : null}
          {previewAssets.length < filtered.length ? <div className="col-span-full flex justify-center"><Button type="button" variant="outline" onClick={() => setVisibleCount((count) => count + PREVIEW_BATCH_SIZE)}>Carregar mais imagens</Button></div> : null}
        </div>
        <div className="flex justify-end"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button></div>
      </DialogContent>
    </Dialog>
  );
}

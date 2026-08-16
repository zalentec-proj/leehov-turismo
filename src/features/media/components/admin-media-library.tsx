"use client";

import Image from "next/image";
import { Search, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteMediaAssetAction, getMediaPreviewUrlsAction, updateMediaAssetAction, uploadMediaAssetAction } from "@/features/media/actions";
import type { MediaAsset, MediaFolder } from "@/features/media/types";
import { mediaFolders } from "@/features/media/types";
import { formatFileSize } from "@/features/media/utils";

const folderLabels: Record<string, string> = { general: "Geral", packages: "Pacotes", blog: "Blog", testimonials: "Depoimentos", popups: "Pop-ups", seo: "SEO", home: "Home" };
const showResult = (result: { success: boolean; message: string }) => { if (result.success) toast.success(result.message); else toast.error(result.message); };

export function AdminMediaLibrary({ assets }: { assets: MediaAsset[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("all");
  const [visibleCount, setVisibleCount] = useState(24);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const filtered = assets.filter((asset) => (folder === "all" || asset.folder === folder) && `${asset.fileName} ${asset.altText} ${asset.caption} ${asset.sourceLabel} ${asset.tags.join(" ")}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")));
  const visibleAssets = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  useEffect(() => {
    const ids = visibleAssets.filter((asset) => !asset.signedUrl && !previewUrls[asset.id]).map((asset) => asset.id);
    if (!ids.length) return;
    startTransition(async () => {
      const result = await getMediaPreviewUrlsAction(ids);
      if (result.success) setPreviewUrls((current) => ({ ...current, ...result.urls }));
    });
  }, [previewUrls, startTransition, visibleAssets]);

  function upload(formData: FormData) {
    startTransition(async () => {
      const result = await uploadMediaAssetAction(formData);
      showResult(result);
      if (result.success) { formRef.current?.reset(); window.location.reload(); }
    });
  }

  return <div className="space-y-6"><Card className="rounded-[18px] border-leehov-border p-6 shadow-leehov-card"><form ref={formRef} action={upload} className="grid gap-4 lg:grid-cols-[1.2fr_180px_1fr_1fr_auto] lg:items-end"><div><Label htmlFor="media-file">Imagem</Label><Input id="media-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="mt-2" /></div><div><Label>Pasta</Label><Select name="folder" defaultValue="general"><SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger><SelectContent>{mediaFolders.map((item) => <SelectItem key={item} value={item}>{folderLabels[item]}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="media-alt">Texto alternativo</Label><Input id="media-alt" name="altText" className="mt-2" placeholder="Descreva a imagem" /></div><div><Label htmlFor="media-caption">Legenda</Label><Input id="media-caption" name="caption" className="mt-2" placeholder="Legenda opcional" /></div><Button disabled={pending} className="h-9 bg-leehov-blue-600"><Upload />{pending ? "Enviando…" : "Enviar"}</Button></form><p className="mt-3 text-xs text-leehov-muted">JPEG, PNG, WebP ou AVIF, até 8 MiB. SVG e arquivos com assinatura inválida são recusados.</p></Card><div className="grid gap-3 md:grid-cols-[1fr_220px]"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-leehov-muted" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(24); }} className="pl-9" placeholder="Buscar por nome, alt ou legenda" /></div><Select value={folder} onValueChange={(value) => { setFolder(value); setVisibleCount(24); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as pastas</SelectItem>{mediaFolders.map((item) => <SelectItem key={item} value={item}>{folderLabels[item]}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visibleAssets.map((asset) => <MediaCard key={asset.id} asset={{ ...asset, signedUrl: previewUrls[asset.id] ?? asset.signedUrl }} />)}{!filtered.length ? <Card className="col-span-full rounded-[18px] border-leehov-border p-12 text-center text-leehov-muted">Nenhuma imagem encontrada.</Card> : null}</div>{visibleAssets.length < filtered.length ? <div className="flex justify-center"><Button type="button" variant="outline" onClick={() => setVisibleCount((count) => count + 24)}>Carregar mais imagens</Button></div> : null}</div>;
}

function MediaCard({ asset }: { asset: MediaAsset }) {
  const [altText, setAltText] = useState(asset.altText);
  const [caption, setCaption] = useState(asset.caption);
  const [folder, setFolder] = useState(asset.folder as MediaFolder);
  const [pending, startTransition] = useTransition();
  return <Card className="rounded-[18px] border-leehov-border p-0 shadow-leehov-card"><div className="relative h-52 overflow-hidden bg-leehov-surface">{asset.signedUrl ? <Image src={asset.signedUrl} alt={asset.altText || asset.fileName} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" /> : null}</div><div className="space-y-4 p-5"><div><p className="truncate font-bold text-leehov-navy-950" title={asset.fileName}>{asset.fileName}</p><p className="mt-1 text-xs text-leehov-muted">{asset.mimeType} · {formatFileSize(asset.fileSize)}</p>{asset.sourceLabel ? <p className="mt-2 text-xs font-semibold text-leehov-blue-700">Origem: {asset.sourceLabel}</p> : null}{asset.tags.length ? <div className="mt-2 flex flex-wrap gap-1">{asset.tags.map((tag) => <span key={tag} className="rounded-full bg-leehov-surface px-2 py-1 text-[11px] text-leehov-muted">{tag}</span>)}</div> : null}</div><Input value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Texto alternativo" aria-label="Texto alternativo" /><Textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Legenda" aria-label="Legenda" rows={2} /><Select value={folder} onValueChange={(value) => setFolder(value as MediaFolder)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{mediaFolders.map((item) => <SelectItem key={item} value={item}>{folderLabels[item]}</SelectItem>)}</SelectContent></Select>{asset.usage.length ? <p className="rounded-lg bg-leehov-surface p-3 text-xs text-leehov-muted">Em uso: {asset.usage.map((item) => item.label).join(", ")}</p> : <p className="text-xs text-leehov-muted">Imagem sem vínculos.</p>}<div className="flex gap-2"><Button disabled={pending} onClick={() => startTransition(async () => { const result = await updateMediaAssetAction({ id: asset.id, altText, caption, folder }); showResult(result); })} className="flex-1 bg-leehov-blue-600">Salvar</Button><Button variant="destructive" size="icon" disabled={pending || asset.usage.length > 0} onClick={() => { if (!window.confirm("Excluir esta imagem da biblioteca?")) return; startTransition(async () => { const result = await deleteMediaAssetAction(asset.id); showResult(result); if (result.success) window.location.reload(); }); }}><Trash2 /></Button></div></div></Card>;
}

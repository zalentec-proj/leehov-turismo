"use client";

import Image from "next/image";
import { Search, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

  return <div className="space-y-6"><Card className="rounded-[18px] border-leehov-border p-6 shadow-leehov-card"><form ref={formRef} action={upload} className="grid gap-4 lg:grid-cols-[1.2fr_180px_1fr_1fr_auto] lg:items-end"><div><Label htmlFor="media-file">Imagem</Label><Input id="media-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="mt-2" /></div><div><Label>Pasta</Label><Select name="folder" defaultValue="general"><SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger><SelectContent>{mediaFolders.map((item) => <SelectItem key={item} value={item}>{folderLabels[item]}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="media-alt">Texto alternativo</Label><Input id="media-alt" name="altText" className="mt-2" placeholder="Descreva a imagem" /></div><div><Label htmlFor="media-caption">Legenda</Label><Input id="media-caption" name="caption" className="mt-2" placeholder="Legenda opcional" /></div><Button disabled={pending} className="h-9 bg-leehov-blue-600"><Upload />{pending ? "Enviando…" : "Enviar"}</Button></form><p className="mt-3 text-xs text-leehov-muted">JPEG, PNG, WebP ou AVIF, até 8 MiB. SVG e arquivos com assinatura inválida são recusados.</p></Card><div className="grid gap-3 md:grid-cols-[1fr_220px]"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-leehov-muted" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(24); }} className="pl-9" placeholder="Buscar por nome, alt ou legenda" /></div><Select value={folder} onValueChange={(value) => { setFolder(value); setVisibleCount(24); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as pastas</SelectItem>{mediaFolders.map((item) => <SelectItem key={item} value={item}>{folderLabels[item]}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{visibleAssets.map((asset) => <MediaCard key={asset.id} asset={{ ...asset, signedUrl: previewUrls[asset.id] ?? asset.signedUrl }} />)}{!filtered.length ? <Card className="col-span-full rounded-[18px] border-leehov-border p-12 text-center text-leehov-muted">Nenhuma imagem encontrada.</Card> : null}</div>{visibleAssets.length < filtered.length ? <div className="flex justify-center"><Button type="button" variant="outline" onClick={() => setVisibleCount((count) => count + 24)}>Carregar mais imagens</Button></div> : null}</div>;
}

function MediaCard({ asset }: { asset: MediaAsset }) {
  const [altText, setAltText] = useState(asset.altText);
  const [caption, setCaption] = useState(asset.caption);
  const [folder, setFolder] = useState(asset.folder as MediaFolder);
  const [pending, startTransition] = useTransition();
  const source = asset.sourceLabel || folderLabels[asset.folder] || "Biblioteca";
  return <Dialog><DialogTrigger asChild><button type="button" className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-leehov-surface text-left ring-1 ring-leehov-border transition hover:-translate-y-0.5 hover:ring-leehov-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leehov-blue-500" aria-label={`Editar imagem: ${asset.fileName}`}><div className="absolute inset-0">{asset.signedUrl ? <Image src={asset.signedUrl} alt={asset.altText || asset.fileName} fill sizes="(max-width: 640px) 33vw, (max-width: 1280px) 25vw, 20vw" className="object-cover transition duration-200 group-hover:scale-[1.03]" /> : null}</div><span className="absolute inset-x-2 bottom-2 truncate rounded-full bg-leehov-navy-950/80 px-2.5 py-1 text-xs font-semibold text-white" title={`Origem: ${source}`}>Origem: {source}</span></button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle className="pr-8">Editar imagem</DialogTitle><DialogDescription className="break-all">{asset.fileName} · {asset.mimeType} · {formatFileSize(asset.fileSize)}</DialogDescription></DialogHeader><div className="relative aspect-video overflow-hidden rounded-xl bg-leehov-surface">{asset.signedUrl ? <Image src={asset.signedUrl} alt={asset.altText || asset.fileName} fill sizes="(max-width: 640px) 100vw, 576px" className="object-cover" /> : null}</div><div className="space-y-4"><p className="inline-flex rounded-full bg-leehov-surface px-3 py-1 text-xs font-semibold text-leehov-blue-700">Origem: {source}</p><Input value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Texto alternativo" aria-label="Texto alternativo" /><Textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Legenda" aria-label="Legenda" rows={3} /><Select value={folder} onValueChange={(value) => setFolder(value as MediaFolder)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{mediaFolders.map((item) => <SelectItem key={item} value={item}>{folderLabels[item]}</SelectItem>)}</SelectContent></Select>{asset.usage.length ? <p className="rounded-lg bg-leehov-surface p-3 text-xs text-leehov-muted">Em uso: {asset.usage.map((item) => item.label).join(", ")}</p> : <p className="text-xs text-leehov-muted">Imagem sem vínculos.</p>}</div><DialogFooter><Button variant="destructive" size="icon" disabled={pending || asset.usage.length > 0} onClick={() => { if (!window.confirm("Excluir esta imagem da biblioteca?")) return; startTransition(async () => { const result = await deleteMediaAssetAction(asset.id); showResult(result); if (result.success) window.location.reload(); }); }}><Trash2 /></Button><Button disabled={pending} onClick={() => startTransition(async () => { const result = await updateMediaAssetAction({ id: asset.id, altText, caption, folder }); showResult(result); })} className="bg-leehov-blue-600">Salvar alterações</Button></DialogFooter></DialogContent></Dialog>;
}

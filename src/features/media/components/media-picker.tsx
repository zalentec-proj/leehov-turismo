"use client";

import Image from "next/image";
import { ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadMediaAssetAction } from "@/features/media/actions";
import type { MediaAsset } from "@/features/media/types";
import { cn } from "@/lib/utils";

type MediaPickerProps = {
  assets: MediaAsset[];
  value: string;
  folder?: string;
  onChange: (asset: MediaAsset | null) => void;
  onAssetCreated?: (asset: MediaAsset) => void;
};

export function MediaPicker({ assets, value, folder = "general", onChange, onAssetCreated }: MediaPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [altText, setAltText] = useState("");
  const [pending, startTransition] = useTransition();
  const selected = assets.find((asset) => asset.id === value) ?? null;

  const upload = (file?: File) => {
    if (!file) return;
    if (altText.trim().length < 2) {
      toast.error("Informe o texto alternativo antes do upload.");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    formData.set("altText", altText.trim());
    formData.set("caption", "");
    formData.set("folder", folder);
    startTransition(async () => {
      const result = await uploadMediaAssetAction(formData);
      if (!result.success || !result.asset) {
        toast.error(result.message);
        return;
      }
      onAssetCreated?.(result.asset);
      onChange(result.asset);
      setAltText("");
      if (inputRef.current) inputRef.current.value = "";
      toast.success("Imagem enviada e selecionada.");
    });
  };

  return (
    <div className="space-y-4">
      {selected ? (
        <div className="overflow-hidden rounded-2xl border border-leehov-border bg-leehov-surface">
          <div className="relative aspect-[16/7] bg-slate-100">
            <Image src={selected.signedUrl} alt={selected.altText} fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover" />
          </div>
          <div className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-leehov-navy-950">{selected.fileName}</p>
              <p className="mt-1 text-xs text-leehov-muted">Alt: {selected.altText || "não informado"}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onChange(null)}>
              <X className="size-4" /> Remover
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="media-picker-alt">Texto alternativo para novo upload</Label>
        <Input id="media-picker-alt" value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Descreva objetivamente a imagem" maxLength={300} />
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          upload(event.dataTransfer.files[0]);
        }}
        className={cn(
          "flex min-h-32 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-5 text-center transition",
          dragging ? "border-leehov-blue-500 bg-sky-50" : "border-leehov-border bg-white hover:border-leehov-blue-400",
        )}
      >
        {pending ? <Loader2 className="mb-2 size-7 animate-spin text-leehov-blue-600" /> : <UploadCloud className="mb-2 size-7 text-leehov-blue-600" />}
        <span className="font-bold text-leehov-navy-950">{pending ? "Enviando imagem…" : "Arraste uma imagem ou clique para selecionar"}</span>
        <span className="mt-1 text-xs text-leehov-muted">JPEG, PNG, WebP ou AVIF · até 8 MiB</span>
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(event) => upload(event.target.files?.[0])} />

      {assets.length ? (
        <div>
          <p className="mb-2 text-sm font-bold text-leehov-navy-950">Ou selecione da biblioteca</p>
          <div className="grid max-h-52 grid-cols-3 gap-2 overflow-y-auto rounded-2xl border border-leehov-border p-2 sm:grid-cols-4">
            {assets.map((asset) => (
              <button
                type="button"
                key={asset.id}
                onClick={() => {
                  if (!asset.altText.trim()) {
                    toast.error("Esta imagem não possui texto alternativo. Edite-a na Biblioteca de mídia antes de usar.");
                    return;
                  }
                  onChange(asset);
                }}
                className={cn("relative aspect-square overflow-hidden rounded-xl border-2 bg-slate-100", value === asset.id ? "border-leehov-blue-600" : "border-transparent")}
                aria-label={`Selecionar ${asset.fileName}`}
              >
                {asset.signedUrl ? <Image src={asset.signedUrl} alt={asset.altText || "Imagem da biblioteca"} fill sizes="140px" className="object-cover" /> : <ImageIcon className="absolute inset-0 m-auto size-6 text-leehov-muted" />}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

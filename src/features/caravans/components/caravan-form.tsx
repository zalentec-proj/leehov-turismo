"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useFieldArray, useForm, Controller, useWatch, type FieldErrors, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  removeCaravanImageAction,
  saveCaravanAction,
  uploadCaravanImageAction,
} from "@/features/caravans/actions";
import { caravanFormSchema, type CaravanFormInput, type CaravanValidationIssue } from "@/features/caravans/schema";
import { validateCaravanImage } from "@/features/caravans/image-validation";
import type { AdminCaravan, CaravanCategory } from "@/features/caravans/types";
import { slugifyCaravanTitle } from "@/features/caravans/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MediaLibrarySelect } from "@/features/media/components/media-library-select";
import type { MediaAsset } from "@/features/media/types";

function defaults(caravan?: AdminCaravan): CaravanFormInput {
  return {
    id: caravan?.id ?? "",
    title: caravan?.title ?? "",
    slug: caravan?.slug ?? "",
    destination: caravan?.destination ?? "",
    categoryId: caravan?.category?.id ?? "",
    type: caravan?.type ?? "",
    summary: caravan?.summary ?? "",
    description: caravan?.description ?? "",
    duration: caravan?.duration === "Duração a confirmar" ? "" : caravan?.duration ?? "",
    price: caravan?.price === "Sob consulta" ? "" : caravan?.price ?? "",
    currency: caravan?.currency ?? "BRL",
    status: caravan?.status ?? "draft",
    cardImagePath: caravan?.imagePath ?? "",
    heroImagePath: caravan?.heroImagePath ?? "",
    videoUrl: caravan?.videoUrl ?? "",
    videoThumbnailPath: caravan?.videoThumbnailPath ?? "",
    isGroupTrip: caravan?.isGroupTrip ?? true,
    isAccompanied: caravan?.isAccompanied ?? true,
    hasPortugueseGuide: caravan?.hasPortugueseGuide ?? false,
    hasLeehovRepresentative: caravan?.hasLeehovRepresentative ?? false,
    hasTravelKit: caravan?.hasTravelKit ?? false,
    hasTravelInsurance: caravan?.hasTravelInsurance ?? false,
    minPeople: caravan?.minPeople ?? null,
    maxPeople: caravan?.maxPeople ?? null,
    leaderName: caravan?.leaderName ?? "",
    leaderBio: caravan?.leaderBio ?? "",
    leaderImagePath: caravan?.leaderImagePath ?? "",
    included: caravan?.included ?? [],
    notIncluded: caravan?.notIncluded ?? [],
    notes: caravan?.notes ?? "",
    featuredHome: caravan?.featuredHome ?? false,
    featuredHero: caravan?.featuredHero ?? false,
    heroTitle: caravan?.heroTitle ?? "",
    heroDescription: caravan?.heroDescription ?? "",
    heroCtaText: caravan?.heroCtaText ?? "Ver detalhes",
    heroCtaUrl: caravan?.heroCtaUrl ?? "",
    heroOrder: caravan?.heroOrder ?? 0,
    published: caravan?.published ?? false,
    seoTitle: caravan?.seoTitle ?? "",
    seoDescription: caravan?.seoDescription ?? "",
    departures: caravan?.departures ?? [],
    itinerary: caravan?.itinerary.map((item) => ({ id: item.id, day: item.day, title: item.title, location: item.location, description: item.description, imagePath: item.imagePath, meals: item.meals, accommodation: item.accommodation, notes: item.notes, orderIndex: item.orderIndex })) ?? [],
    images: caravan?.images.map((item) => ({ id: item.id, imagePath: item.imagePath, altText: item.altText, caption: item.caption, orderIndex: item.orderIndex })) ?? [],
  };
}

function Field({ label, error, helper, children }: { label: string; error?: string; helper?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}{helper ? <p className="text-xs text-leehov-muted">{helper}</p> : null}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}

function BooleanField({ label, description, checked, onCheckedChange }: { label: string; description?: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-leehov-border p-4">
      <div><Label>{label}</Label>{description ? <p className="mt-1 text-xs text-leehov-muted">{description}</p> : null}</div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

const caravanFormTabs = [
  { value: "general", fields: ["title", "slug", "destination", "categoryId", "type", "summary", "description", "duration", "price", "currency"] },
  { value: "images", fields: ["cardImagePath", "heroImagePath", "videoUrl", "videoThumbnailPath", "images"] },
  { value: "departures", fields: ["departures"] },
  { value: "itinerary", fields: ["itinerary"] },
  { value: "included", fields: ["included", "notIncluded", "notes"] },
  { value: "group", fields: ["isGroupTrip", "isAccompanied", "hasPortugueseGuide", "hasLeehovRepresentative", "hasTravelKit", "hasTravelInsurance", "minPeople", "maxPeople", "leaderName", "leaderBio", "leaderImagePath"] },
  { value: "seo", fields: ["seoTitle", "seoDescription"] },
  { value: "publication", fields: ["status", "featuredHome", "featuredHero", "heroTitle", "heroDescription", "heroCtaText", "heroCtaUrl", "heroOrder", "published"] },
] as const;

const currencyOptions = [
  { value: "BRL", label: "Real brasileiro (BRL)" },
  { value: "USD", label: "Dólar americano (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
] as const;

function tabWithFirstError(errors: FieldErrors<CaravanFormInput>) {
  return caravanFormTabs.find((tab) => tab.fields.some((field) => field in errors))?.value ?? "general";
}

function tabForIssuePath(path: string) {
  const root = path.split(".")[0];
  return caravanFormTabs.find((tab) => tab.fields.some((field) => field === root))?.value ?? "general";
}

function collectFormIssues(errors: FieldErrors<CaravanFormInput>, prefix = ""): CaravanValidationIssue[] {
  const issues: CaravanValidationIssue[] = [];
  Object.entries(errors).forEach(([key, value]) => {
    if (!value) return;
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && "message" in value && typeof value.message === "string") {
      issues.push({ path, message: value.message });
      return;
    }
    if (typeof value === "object") issues.push(...collectFormIssues(value as FieldErrors<CaravanFormInput>, path));
  });
  return issues;
}

function issueContext(path: string) {
  const [root, index, field] = path.split(".");
  const labels: Record<string, string> = {
    title: "Nome do pacote",
    slug: "Slug",
    destination: "Destino",
    currency: "Moeda",
    summary: "Resumo",
    description: "Descrição",
    duration: "Duração",
    heroImagePath: "Imagem principal",
    status: "Status",
    heroTitle: "Título do Hero",
    heroDescription: "Descrição do Hero",
    maxPeople: "Máximo de pessoas",
    videoUrl: "URL do vídeo",
    images: "Galeria",
  };
  const nestedLabels: Record<string, string> = {
    day: "número do dia",
    title: "título",
    startDate: "data inicial",
    endDate: "data final",
    imagePath: "imagem",
    altText: "texto alternativo",
  };
  if (root === "itinerary" && index !== undefined) return `Roteiro — dia ${Number(index) + 1}${field ? `, ${nestedLabels[field] ?? field}` : ""}`;
  if (root === "departures" && index !== undefined) return `Saídas — item ${Number(index) + 1}${field ? `, ${nestedLabels[field] ?? field}` : ""}`;
  if (root === "images" && index !== undefined) return `Galeria — imagem ${Number(index) + 1}${field ? `, ${nestedLabels[field] ?? field}` : ""}`;
  return labels[root] ?? "Dados do pacote";
}

function PackageImagePicker({
  id,
  label,
  helper,
  preview,
  disabled,
  uploading,
  onSelect,
  onClear,
  onChoose,
}: {
  id: string;
  label: string;
  helper: string;
  preview?: string;
  disabled: boolean;
  uploading: boolean;
  onSelect: (file: File | undefined) => void;
  onClear: () => void;
  onChoose: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-leehov-blue-300 bg-leehov-surface/45 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label htmlFor={id}>{label}</Label>
          <p className="mt-1 text-xs leading-5 text-leehov-muted">{helper}</p>
        </div>
        {preview ? <Button type="button" variant="ghost" size="icon" className="size-8 text-leehov-muted hover:text-destructive" aria-label={`Remover ${label.toLowerCase()}`} onClick={onClear}><X className="size-4" /></Button> : null}
      </div>
      <label htmlFor={id} className="mt-4 flex cursor-pointer items-center gap-4 rounded-xl border border-leehov-border bg-white p-3 transition hover:border-leehov-blue-400 focus-within:ring-2 focus-within:ring-leehov-blue-300/40">
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-leehov-surface text-leehov-blue-500">
          {preview ? <Image src={preview} alt="" fill unoptimized={preview.startsWith("http")} sizes="80px" className="object-cover" /> : <ImagePlus className="size-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-leehov-navy-950">{preview ? "Trocar imagem" : "Selecionar imagem"}</p>
          <p className="mt-1 text-xs text-leehov-muted">JPEG, PNG, WebP ou AVIF · até 8 MiB</p>
        </div>
        {uploading ? <Loader2 className="size-5 shrink-0 animate-spin text-leehov-blue-500" /> : <ImagePlus className="size-5 shrink-0 text-leehov-blue-500" />}
      </label>
      <Input id={id} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/avif" disabled={disabled} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; onSelect(file); }} />
      <Button type="button" variant="ghost" size="sm" className="mt-2 w-full text-leehov-blue-700" disabled={disabled} onClick={onChoose}>Escolher da Biblioteca de Mídia</Button>
    </div>
  );
}

type LibraryTarget =
  | { type: "asset"; field: "cardImagePath" | "heroImagePath" | "leaderImagePath"; previewKey: "card" | "hero" | "leader" }
  | { type: "gallery" }
  | { type: "itinerary"; index: number };

export function CaravanForm({ caravan, categories, mediaAssets }: { caravan?: AdminCaravan; categories: CaravanCategory[]; mediaAssets: MediaAsset[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [uploading, setUploading] = useState(false);
  const [uploadingItineraryIndex, setUploadingItineraryIndex] = useState<number | null>(null);
  const [libraryTarget, setLibraryTarget] = useState<LibraryTarget | null>(null);
  const [assetPreviews, setAssetPreviews] = useState<Record<"card" | "hero" | "leader", string>>(() => ({
    card: caravan?.imageUrl ?? "",
    hero: caravan?.heroImagePath && caravan.heroImageUrl !== "/images/leehov/hero-fallback.jpg" ? caravan.heroImageUrl : "",
    leader: caravan?.leaderImageUrl ?? "",
  }));
  const [galleryPreviews, setGalleryPreviews] = useState<Record<string, string>>(() => Object.fromEntries(caravan?.images.filter((image) => image.imagePath && image.imageUrl).map((image) => [image.imagePath, image.imageUrl]) ?? []));
  const [itineraryPreviews, setItineraryPreviews] = useState<Record<string, string>>(() => Object.fromEntries(caravan?.itinerary.filter((day) => day.imagePath && day.imageUrl).map((day) => [day.imagePath, day.imageUrl]) ?? []));
  const [lastError, setLastError] = useState("");
  const [validationIssues, setValidationIssues] = useState<CaravanValidationIssue[]>([]);
  const [saveNotice, setSaveNotice] = useState("");
  const form = useForm<CaravanFormInput>({ resolver: zodResolver(caravanFormSchema), defaultValues: defaults(caravan), mode: "onBlur" });
  const departures = useFieldArray({ control: form.control, name: "departures" });
  const itinerary = useFieldArray({ control: form.control, name: "itinerary" });
  const images = useFieldArray({ control: form.control, name: "images" });
  const formCaravanId = useWatch({ control: form.control, name: "id" });
  const title = useWatch({ control: form.control, name: "title" });
  const watchedItinerary = useWatch({ control: form.control, name: "itinerary" });
  const watchedImages = useWatch({ control: form.control, name: "images" });

  useEffect(() => {
    if (!caravan && !form.getFieldState("slug").isDirty) form.setValue("slug", slugifyCaravanTitle(title));
  }, [caravan, form, title]);

  async function onSubmit(input: CaravanFormInput) {
    setLastError("");
    setSaveNotice("");
    setValidationIssues([]);
    try {
      const result = await saveCaravanAction(input);
      if (!result.success) {
        setLastError(result.message);
        setValidationIssues(result.issues ?? []);
        result.issues?.forEach((issue) => form.setError(issue.path as Path<CaravanFormInput>, { type: "server", message: issue.message }));
        if (result.issues?.[0]) setActiveTab(tabForIssuePath(result.issues[0].path));
        return toast.error(result.message);
      }
      if (result.savedAsDraft) form.setValue("published", false, { shouldDirty: false });
      if (result.disabledFeaturedHero) form.setValue("featuredHero", false, { shouldDirty: false });
      setValidationIssues(result.issues ?? []);
      setSaveNotice(result.issues?.length ? result.message : "");
      if (result.issues?.length) toast.warning(result.message);
      else toast.success(result.message);
      if (!caravan && result.id) router.push(`/admin/caravanas/${result.id}`);
      else router.refresh();
    } catch {
      const message = "O pacote pode ter sido salvo, mas não foi possível atualizar esta tela. Recarregue a página para confirmar.";
      setLastError(message);
      toast.error(message);
    }
  }

  function onInvalid(errors: FieldErrors<CaravanFormInput>) {
    const targetTab = tabWithFirstError(errors);
    const issues = collectFormIssues(errors);
    const message = issues.length === 1 ? "Existe 1 campo que precisa ser corrigido antes de salvar." : `Existem ${issues.length} campos que precisam ser corrigidos antes de salvar.`;
    setActiveTab(targetTab);
    setLastError(message);
    setSaveNotice("");
    setValidationIssues(issues);
    toast.error(message);
  }

  async function ensureDraftForUpload() {
    const currentId = form.getValues("id");
    if (currentId) return { id: currentId, created: false };

    form.setValue("status", "draft", { shouldDirty: true });
    form.setValue("published", false, { shouldDirty: true });
    const valid = await form.trigger();
    if (!valid) {
      onInvalid(form.formState.errors);
      toast.info("Preencha os dados obrigatórios para salvar o rascunho antes do primeiro upload.");
      return null;
    }

    const result = await saveCaravanAction(form.getValues());
    if (!result.success || !result.id) {
      toast.error(result.message);
      return null;
    }
    form.setValue("id", result.id, { shouldDirty: false });
    toast.success("Rascunho criado. Enviando a imagem...");
    return { id: result.id, created: true };
  }

  async function finishFirstUpload(created: boolean) {
    if (!created) return;
    const result = await saveCaravanAction(form.getValues());
    if (!result.success || !result.id) {
      toast.error("A imagem foi enviada, mas não foi possível vinculá-la automaticamente. Clique em Salvar pacote.");
      return;
    }
    router.replace(`/admin/caravanas/${result.id}`);
    router.refresh();
  }

  async function sendCaravanImage(caravanId: string, file: File, role: "card" | "hero" | "leader" | "gallery" | "itinerary") {
    const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
    const validation = validateCaravanImage(file.type, file.size, header);
    if (!validation.success) return validation;

    const data = new FormData();
    data.set("file", file);
    data.set("role", role);
    return uploadCaravanImageAction(caravanId, data);
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const draft = await ensureDraftForUpload();
      if (!draft) return;
      const result = await sendCaravanImage(draft.id, file, "gallery");
      if (!result.success || !result.path) return toast.error(result.message);
      images.append({ id: "", imagePath: result.path, altText: title, caption: "", orderIndex: images.fields.length * 10 });
      if (result.url) setGalleryPreviews((current) => ({ ...current, [result.path as string]: result.url as string }));
      if (!form.getValues("cardImagePath")) form.setValue("cardImagePath", result.path, { shouldDirty: true });
      if (!form.getValues("heroImagePath")) form.setValue("heroImagePath", result.path, { shouldDirty: true });
      toast.success("Imagem adicionada. Salve para confirmar a galeria.");
      await finishFirstUpload(draft.created);
    } catch {
      toast.error("Não foi possível enviar a imagem. Verifique sua conexão e tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  async function uploadAsset(field: "cardImagePath" | "heroImagePath" | "leaderImagePath", previewKey: "card" | "hero" | "leader", file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const draft = await ensureDraftForUpload();
      if (!draft) return;
      const result = await sendCaravanImage(draft.id, file, previewKey);
      if (!result.success || !result.path) return toast.error(result.message);
      form.setValue(field, result.path, { shouldDirty: true, shouldValidate: true });
      if (result.url) setAssetPreviews((current) => ({ ...current, [previewKey]: result.url as string }));
      toast.success("Imagem enviada. Salve o pacote para confirmar a alteração.");
      await finishFirstUpload(draft.created);
    } catch {
      toast.error("Não foi possível enviar a imagem. Verifique sua conexão e tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  function clearAsset(field: "cardImagePath" | "heroImagePath" | "leaderImagePath", previewKey: "card" | "hero" | "leader") {
    form.setValue(field, "", { shouldDirty: true, shouldValidate: true });
    setAssetPreviews((current) => ({ ...current, [previewKey]: "" }));
  }

  function chooseLibraryAsset(asset: MediaAsset) {
    if (!libraryTarget) return;
    if (libraryTarget.type === "asset") {
      form.setValue(libraryTarget.field, asset.storagePath, { shouldDirty: true, shouldValidate: true });
      setAssetPreviews((current) => ({ ...current, [libraryTarget.previewKey]: asset.signedUrl }));
    } else if (libraryTarget.type === "gallery") {
      if (form.getValues("images").some((image) => image.imagePath === asset.storagePath)) return toast.info("Esta imagem já está na galeria.");
      images.append({ id: "", imagePath: asset.storagePath, altText: asset.altText || title, caption: asset.caption, orderIndex: images.fields.length * 10 });
      setGalleryPreviews((current) => ({ ...current, [asset.storagePath]: asset.signedUrl }));
    } else {
      form.setValue(`itinerary.${libraryTarget.index}.imagePath`, asset.storagePath, { shouldDirty: true, shouldValidate: true });
      setItineraryPreviews((current) => ({ ...current, [asset.storagePath]: asset.signedUrl }));
    }
    toast.success("Imagem vinculada sem duplicar o arquivo.");
  }

  async function removeImage(index: number) {
    const image = form.getValues(`images.${index}`);
    if (caravan && image.imagePath.startsWith(`${caravan.id}/`)) {
      const result = await removeCaravanImageAction(caravan.id, image.imagePath);
      if (!result.success) return toast.error(result.message);
      toast.success(result.message);
    }
    setGalleryPreviews((current) => {
      const next = { ...current };
      delete next[image.imagePath];
      return next;
    });
    images.remove(index);
  }

  async function uploadItineraryImage(index: number, file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadingItineraryIndex(index);
    try {
      const draft = await ensureDraftForUpload();
      if (!draft) return;
      const result = await sendCaravanImage(draft.id, file, "itinerary");
      if (!result.success || !result.path) return toast.error(result.message);
      form.setValue(`itinerary.${index}.imagePath`, result.path, { shouldDirty: true, shouldValidate: true });
      if (result.url) setItineraryPreviews((current) => ({ ...current, [result.path as string]: result.url as string }));
      toast.success(`Imagem do dia ${form.getValues(`itinerary.${index}.day`)} enviada. Salve o pacote para confirmar.`);
      await finishFirstUpload(draft.created);
    } catch {
      toast.error("Não foi possível enviar a imagem do roteiro. Verifique sua conexão e tente novamente.");
    } finally {
      setUploadingItineraryIndex(null);
      setUploading(false);
    }
  }

  const errors = form.formState.errors;
  return (
    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      {lastError ? (
        <Alert variant="destructive" aria-live="assertive">
          <AlertDescription>
            <p className="font-semibold">{lastError}</p>
            {validationIssues.length ? (
              <ul className="mt-2 space-y-1">
                {validationIssues.map((issue, index) => (
                  <li key={`${issue.path}-${index}`}>
                    <button type="button" className="text-left underline underline-offset-2" onClick={() => setActiveTab(tabForIssuePath(issue.path))}>
                      {issueContext(issue.path)}: {issue.message}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
      {saveNotice ? (
        <Alert className="border-amber-300 bg-amber-50 text-amber-950" aria-live="polite">
          <AlertDescription>
            <p className="font-semibold">{saveNotice}</p>
            <ul className="mt-2 space-y-1">
              {validationIssues.map((issue, index) => (
                <li key={`${issue.path}-${index}`}>
                  <button type="button" className="text-left underline underline-offset-2" onClick={() => setActiveTab(tabForIssuePath(issue.path))}>
                    {issueContext(issue.path)}: {issue.message}
                  </button>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-[16px] bg-white p-2">
          <TabsTrigger value="general">1. Informações gerais</TabsTrigger>
          <TabsTrigger value="images">2. Imagens</TabsTrigger>
          <TabsTrigger value="departures">3. Saídas</TabsTrigger>
          <TabsTrigger value="itinerary">4. Roteiro</TabsTrigger>
          <TabsTrigger value="included">5. Inclusos</TabsTrigger>
          <TabsTrigger value="group">6. Grupo</TabsTrigger>
          <TabsTrigger value="seo">7. SEO</TabsTrigger>
          <TabsTrigger value="publication">8. Publicação</TabsTrigger>
        </TabsList>

        <TabsContent value="general"><Card className="grid gap-5 rounded-[18px] border-leehov-border p-6 md:grid-cols-2">
          <Field label="Nome do pacote" error={errors.title?.message}><Input {...form.register("title")} /></Field>
          <Field label="Slug" error={errors.slug?.message}><Input {...form.register("slug")} /></Field>
          <Field label="Destino" error={errors.destination?.message}><Input {...form.register("destination")} /></Field>
          <Field label="Categoria"><Controller control={form.control} name="categoryId" render={({ field }) => <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="none">Sem categoria</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}{category.active ? "" : " (inativa)"}</SelectItem>)}</SelectContent></Select>} /></Field>
          <Field label="Tipo"><Input {...form.register("type")} placeholder="Cultural, religioso..." /></Field>
          <Field label="Duração" error={errors.duration?.message}><Input {...form.register("duration")} placeholder="14 dias" /></Field>
          <Field label="Preço textual"><Input {...form.register("price")} placeholder="Sob consulta" /></Field>
          <Field label="Moeda" error={errors.currency?.message}>
            <Controller control={form.control} name="currency" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Selecione a moeda" /></SelectTrigger>
                <SelectContent>{currencyOptions.map((currency) => <SelectItem key={currency.value} value={currency.value}>{currency.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </Field>
          <div className="md:col-span-2"><Field label="Resumo" error={errors.summary?.message}><Textarea rows={3} {...form.register("summary")} /></Field></div>
          <div className="md:col-span-2"><Field label="Descrição" error={errors.description?.message}><Textarea rows={7} {...form.register("description")} /></Field></div>
        </Card></TabsContent>

        <TabsContent value="images"><Card className="space-y-6 rounded-[18px] border-leehov-border p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <PackageImagePicker id="card-image-upload" label="Imagem do card" helper="Usada nos cards do site e como imagem principal do compartilhamento." preview={assetPreviews.card} disabled={uploading} uploading={uploading} onSelect={(file) => uploadAsset("cardImagePath", "card", file)} onClear={() => clearAsset("cardImagePath", "card")} onChoose={() => setLibraryTarget({ type: "asset", field: "cardImagePath", previewKey: "card" })} />
            <PackageImagePicker id="hero-image-upload" label="Imagem principal" helper="Usada no Hero e mantida como fallback quando não houver vídeo ou ele não carregar." preview={assetPreviews.hero} disabled={uploading} uploading={uploading} onSelect={(file) => uploadAsset("heroImagePath", "hero", file)} onClear={() => clearAsset("heroImagePath", "hero")} onChoose={() => setLibraryTarget({ type: "asset", field: "heroImagePath", previewKey: "hero" })} />
            <Input type="hidden" {...form.register("cardImagePath")} />
            <Input type="hidden" {...form.register("heroImagePath")} />
            <Input type="hidden" {...form.register("videoThumbnailPath")} />
          </div>
          {!formCaravanId ? <p className="-mt-2 text-xs text-leehov-muted">No primeiro envio, o rascunho será criado automaticamente após a validação dos dados obrigatórios.</p> : null}
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="URL do vídeo de fundo da Home" error={errors.videoUrl?.message}><Input {...form.register("videoUrl")} placeholder="YouTube, Vimeo ou arquivo HTTPS" /><p className="text-xs leading-5 text-leehov-muted">O vídeo é reproduzido sem som no Hero da Home; a imagem principal permanece como fallback.</p></Field>
          </div>
          <div className="rounded-xl border border-dashed border-leehov-blue-300 p-5">
            <Label htmlFor="caravan-upload">Enviar JPEG, PNG, WebP ou AVIF (até 8 MiB)</Label>
            <div className="mt-3 flex items-center gap-3"><Input id="caravan-upload" type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; void upload(file); }} />{uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5 text-leehov-blue-500" />}</div>
            <Button type="button" variant="outline" className="mt-3" disabled={uploading} onClick={() => setLibraryTarget({ type: "gallery" })}>Adicionar da Biblioteca de Mídia</Button>
          </div>
          <div className="space-y-3">
            <Label>Galeria</Label>
            {images.fields.map((field, index) => {
              const imagePath = watchedImages?.[index]?.imagePath ?? field.imagePath;
              const preview = galleryPreviews[imagePath];
              return (
                <div key={field.id} className="grid gap-4 rounded-xl bg-leehov-surface p-4 md:grid-cols-[112px_minmax(0,1fr)_auto] md:items-center">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-white">
                    {preview ? <Image src={preview} alt="" fill unoptimized={preview.startsWith("http")} sizes="112px" className="object-cover" /> : <div className="flex size-full items-center justify-center text-leehov-muted"><ImagePlus className="size-5" /></div>}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input type="hidden" {...form.register(`images.${index}.imagePath`)} />
                    <Field label="Texto alternativo" error={errors.images?.[index]?.altText?.message}><Input {...form.register(`images.${index}.altText`)} placeholder="Descreva a imagem" /></Field>
                    <Field label="Legenda"><Input {...form.register(`images.${index}.caption`)} placeholder="Legenda opcional" /></Field>
                  </div>
                  <Button type="button" variant="outline" size="icon" aria-label={`Remover imagem ${index + 1}`} onClick={() => removeImage(index)}><Trash2 className="size-4" /></Button>
                </div>
              );
            })}
            {!images.fields.length ? <p className="rounded-xl border border-dashed border-leehov-border p-5 text-sm text-leehov-muted">Nenhuma imagem adicionada à galeria.</p> : null}
          </div>
        </Card></TabsContent>

        <TabsContent value="departures"><Card className="space-y-4 rounded-[18px] border-leehov-border p-6">
          <div className="flex items-center justify-between"><div><h3 className="font-bold text-leehov-navy-950">Saídas e períodos</h3><p className="text-sm text-leehov-muted">Informe as datas. O nome da saída será criado automaticamente.</p></div><Button type="button" variant="outline" onClick={() => departures.append({ id: "", label: "", startDate: "", endDate: "", availableSpots: null, status: "available", notes: "", orderIndex: departures.fields.length * 10 })}><Plus className="size-4" />Adicionar saída</Button></div>
          {departures.fields.map((field, index) => <div key={field.id} className="rounded-xl bg-leehov-surface p-4"><div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm font-bold text-leehov-navy-950">Saída {index + 1}</p><Button type="button" variant="ghost" size="sm" className="text-leehov-muted hover:text-destructive" onClick={() => departures.remove(index)}><Trash2 className="size-4" />Remover</Button></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Field label="Data de início"><Input type="date" {...form.register(`departures.${index}.startDate`)} /></Field><Field label="Data de fim (opcional)"><Input type="date" {...form.register(`departures.${index}.endDate`)} /></Field><Field label="Vagas (opcional)"><Input type="number" min={0} placeholder="Não informado" {...form.register(`departures.${index}.availableSpots`, { setValueAs: (value) => value === "" ? null : Number(value) })} /></Field><Field label="Status"><Controller control={form.control} name={`departures.${index}.status`} render={({ field: statusField }) => <Select value={statusField.value} onValueChange={statusField.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="available">Disponível</SelectItem><SelectItem value="coming_soon">Em breve</SelectItem><SelectItem value="waitlist">Lista de espera</SelectItem><SelectItem value="sold_out">Esgotada</SelectItem></SelectContent></Select>} /></Field></div></div>)}
        </Card></TabsContent>

        <TabsContent value="itinerary"><Card className="space-y-5 rounded-[18px] border-leehov-border p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h3 className="font-bold text-leehov-navy-950">Roteiro dia a dia</h3><p className="text-sm text-leehov-muted">Cada dia pode ter descrição, imagem, refeições e hospedagem próprias.</p></div><Button type="button" variant="outline" onClick={() => itinerary.append({ id: "", day: itinerary.fields.length + 1, title: "", location: "", description: "", imagePath: "", meals: [], accommodation: "", notes: "", orderIndex: itinerary.fields.length * 10 })}><Plus className="size-4" />Adicionar dia</Button></div>
          {itinerary.fields.map((field, index) => {
            const imagePath = watchedItinerary?.[index]?.imagePath ?? "";
            const preview = itineraryPreviews[imagePath];
            return (
              <div key={field.id} className="overflow-hidden rounded-[18px] border border-leehov-border bg-leehov-surface">
                <div className="grid gap-5 p-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white">
                      {preview ? <Image src={preview} alt="" fill unoptimized={preview.startsWith("http")} sizes="220px" className="object-cover" /> : <div className="flex size-full items-center justify-center text-center text-xs text-leehov-muted"><ImagePlus className="mr-2 size-4" />Imagem do dia</div>}
                    </div>
                    <Label htmlFor={`itinerary-upload-${index}`} className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-leehov-blue-600">
                      {uploadingItineraryIndex === index ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                      {uploadingItineraryIndex === index ? "Enviando imagem..." : preview ? "Trocar imagem" : "Enviar imagem"}
                    </Label>
                    <Input id={`itinerary-upload-${index}`} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; void uploadItineraryImage(index, file); }} />
                    <Button type="button" variant="ghost" size="sm" className="mt-1 px-0 text-xs text-leehov-blue-700" disabled={uploading} onClick={() => setLibraryTarget({ type: "itinerary", index })}>Escolher da biblioteca</Button>
                    {!formCaravanId ? <p className="mt-2 text-xs text-leehov-muted">O rascunho será criado no primeiro envio.</p> : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-[110px_1fr_1fr_auto]">
                    <Field label="Dia"><Input type="number" min={1} {...form.register(`itinerary.${index}.day`, { valueAsNumber: true })} /></Field>
                    <Field label="Título" error={errors.itinerary?.[index]?.title?.message}><Input {...form.register(`itinerary.${index}.title`)} /></Field>
                    <Field label="Local"><Input {...form.register(`itinerary.${index}.location`)} /></Field>
                    <div className="flex items-end"><Button type="button" variant="outline" size="icon" aria-label={`Remover dia ${index + 1}`} onClick={() => itinerary.remove(index)}><Trash2 className="size-4" /></Button></div>
                    <div className="md:col-span-4"><Field label="Descrição"><Textarea rows={4} {...form.register(`itinerary.${index}.description`)} /></Field></div>
                    <Input type="hidden" {...form.register(`itinerary.${index}.imagePath`)} />
                    <Field label="Hospedagem"><Input {...form.register(`itinerary.${index}.accommodation`)} /></Field>
                    <Field label="Refeições"><Controller control={form.control} name={`itinerary.${index}.meals`} render={({ field: mealsField }) => <Input value={mealsField.value.join(", ")} onChange={(event) => mealsField.onChange(event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="Café da manhã, jantar" />} /></Field>
                  </div>
                </div>
              </div>
            );
          })}
        </Card></TabsContent>

        <TabsContent value="included"><Card className="grid gap-6 rounded-[18px] border-leehov-border p-6 md:grid-cols-2">
          <Field label="Inclusos — um por linha"><Controller control={form.control} name="included" render={({ field }) => <Textarea rows={12} value={field.value.join("\n")} onChange={(event) => field.onChange(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} />} /></Field>
          <Field label="Não inclusos — um por linha"><Controller control={form.control} name="notIncluded" render={({ field }) => <Textarea rows={12} value={field.value.join("\n")} onChange={(event) => field.onChange(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} />} /></Field>
          <div className="md:col-span-2"><Field label="Observações internas"><Textarea rows={4} {...form.register("notes")} /></Field></div>
        </Card></TabsContent>

        <TabsContent value="group"><Card className="grid gap-5 rounded-[18px] border-leehov-border p-6 md:grid-cols-2">
          {([ ["isGroupTrip", "Viagem em grupo"], ["isAccompanied", "Roteiro acompanhado"], ["hasPortugueseGuide", "Guia em português"], ["hasLeehovRepresentative", "Representante Leehov"], ["hasTravelKit", "Kit de viagem"], ["hasTravelInsurance", "Seguro-viagem"] ] as const).map(([name, label]) => <Controller key={name} control={form.control} name={name} render={({ field }) => <BooleanField label={label} checked={field.value} onCheckedChange={field.onChange} />} />)}
          <Field label="Mínimo de pessoas"><Input type="number" min={1} {...form.register("minPeople", { setValueAs: (value) => value === "" ? null : Number(value) })} /></Field><Field label="Máximo de pessoas"><Input type="number" min={1} {...form.register("maxPeople", { setValueAs: (value) => value === "" ? null : Number(value) })} /></Field>
          <Field label="Líder / acompanhamento"><Input {...form.register("leaderName")} /></Field>
          <PackageImagePicker id="leader-image-upload" label="Foto do líder" helper="Imagem exibida na apresentação do acompanhamento deste pacote." preview={assetPreviews.leader} disabled={uploading} uploading={uploading} onSelect={(file) => uploadAsset("leaderImagePath", "leader", file)} onClear={() => clearAsset("leaderImagePath", "leader")} onChoose={() => setLibraryTarget({ type: "asset", field: "leaderImagePath", previewKey: "leader" })} />
          <Input type="hidden" {...form.register("leaderImagePath")} />
          <div className="md:col-span-2"><Field label="Apresentação do líder"><Textarea rows={5} {...form.register("leaderBio")} /></Field></div>
        </Card></TabsContent>

        <TabsContent value="seo"><Card className="grid gap-5 rounded-[18px] border-leehov-border p-6">
          <Field label="Título SEO"><Input {...form.register("seoTitle")} maxLength={70} /></Field><Field label="Descrição SEO"><Textarea {...form.register("seoDescription")} maxLength={180} /></Field>
        </Card></TabsContent>

        <TabsContent value="publication"><Card className="grid gap-5 rounded-[18px] border-leehov-border p-6 md:grid-cols-2">
          <Field label="Status" error={errors.status?.message}><Controller control={form.control} name="status" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Rascunho</SelectItem><SelectItem value="available">Disponível</SelectItem><SelectItem value="coming_soon">Em breve</SelectItem><SelectItem value="waitlist">Lista de espera</SelectItem><SelectItem value="sold_out">Esgotada</SelectItem></SelectContent></Select>} /></Field>
          <Field label="Ordem no Hero"><Input type="number" min={0} {...form.register("heroOrder", { valueAsNumber: true })} /></Field>
          <Controller control={form.control} name="published" render={({ field }) => <BooleanField label="Publicado" description="Torna o pacote visível no site." checked={field.value} onCheckedChange={field.onChange} />} />
          <Controller control={form.control} name="featuredHome" render={({ field }) => <BooleanField label="Destaque na Home" checked={field.value} onCheckedChange={field.onChange} />} />
          <Controller control={form.control} name="featuredHero" render={({ field }) => <BooleanField label="Destaque no Hero" checked={field.value} onCheckedChange={field.onChange} />} />
          <div className="md:col-span-2 grid gap-5 md:grid-cols-2"><Field label="Título do Hero" helper="Até 64 caracteres." error={errors.heroTitle?.message}><Input {...form.register("heroTitle")} maxLength={64} /></Field><Field label="Texto do botão"><Input {...form.register("heroCtaText")} /></Field><Field label="URL do botão"><Input {...form.register("heroCtaUrl")} /></Field><Field label="Descrição do Hero" helper="Até 180 caracteres." error={errors.heroDescription?.message}><Textarea {...form.register("heroDescription")} maxLength={180} /></Field></div>
        </Card></TabsContent>
      </Tabs>
      <MediaLibrarySelect open={Boolean(libraryTarget)} onOpenChange={(open) => { if (!open) setLibraryTarget(null); }} assets={mediaAssets} onSelect={chooseLibraryAsset} />
      <div className="sticky bottom-5 z-20 flex justify-end"><Button type="submit" size="lg" disabled={form.formState.isSubmitting || uploading} className="rounded-full bg-leehov-blue-600 px-7 text-white shadow-leehov-floating hover:bg-leehov-cyan">{form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{form.formState.isSubmitting ? "Salvando..." : "Salvar pacote"}</Button></div>
    </form>
  );
}

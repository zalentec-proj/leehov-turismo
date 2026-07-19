"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useFieldArray, useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { removeCaravanImageAction, saveCaravanAction, uploadCaravanImageAction } from "@/features/caravans/actions";
import { caravanFormSchema, type CaravanFormInput } from "@/features/caravans/schema";
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}

function BooleanField({ label, description, checked, onCheckedChange }: { label: string; description?: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-leehov-border p-4">
      <div><Label>{label}</Label>{description ? <p className="mt-1 text-xs text-leehov-muted">{description}</p> : null}</div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function CaravanForm({ caravan, categories }: { caravan?: AdminCaravan; categories: CaravanCategory[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [itineraryPreviews, setItineraryPreviews] = useState<Record<string, string>>(() => Object.fromEntries(caravan?.itinerary.filter((day) => day.imagePath && day.imageUrl).map((day) => [day.imagePath, day.imageUrl]) ?? []));
  const [lastResult, setLastResult] = useState("");
  const form = useForm<CaravanFormInput>({ resolver: zodResolver(caravanFormSchema), defaultValues: defaults(caravan), mode: "onBlur" });
  const departures = useFieldArray({ control: form.control, name: "departures" });
  const itinerary = useFieldArray({ control: form.control, name: "itinerary" });
  const images = useFieldArray({ control: form.control, name: "images" });
  const title = useWatch({ control: form.control, name: "title" });
  const watchedItinerary = useWatch({ control: form.control, name: "itinerary" });

  useEffect(() => {
    if (!caravan && !form.getFieldState("slug").isDirty) form.setValue("slug", slugifyCaravanTitle(title));
  }, [caravan, form, title]);

  async function onSubmit(input: CaravanFormInput) {
    setLastResult("");
    const result = await saveCaravanAction(input);
    setLastResult(result.message);
    if (!result.success) return toast.error(result.message);
    toast.success(result.message);
    if (!input.id && result.id) router.push(`/admin/caravanas/${result.id}`);
    else router.refresh();
  }

  async function upload(file: File | undefined) {
    const caravanId = form.getValues("id");
    if (!caravanId) return toast.info("Salve a caravana antes de enviar imagens.");
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.set("file", file);
    const result = await uploadCaravanImageAction(caravanId, data);
    setUploading(false);
    if (!result.success || !result.path) return toast.error(result.message);
    images.append({ id: "", imagePath: result.path, altText: title, caption: "", orderIndex: images.fields.length * 10 });
    if (!form.getValues("cardImagePath")) form.setValue("cardImagePath", result.path, { shouldDirty: true });
    if (!form.getValues("heroImagePath")) form.setValue("heroImagePath", result.path, { shouldDirty: true });
    toast.success("Imagem adicionada. Salve para confirmar a galeria.");
  }

  async function removeImage(index: number) {
    const image = form.getValues(`images.${index}`);
    if (caravan && image.imagePath.startsWith(`${caravan.id}/`)) {
      const result = await removeCaravanImageAction(caravan.id, image.imagePath);
      if (!result.success) return toast.error(result.message);
      toast.success(result.message);
    }
    images.remove(index);
  }

  async function uploadItineraryImage(index: number, file: File | undefined) {
    const caravanId = form.getValues("id");
    if (!caravanId) return toast.info("Salve a caravana antes de enviar imagens.");
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.set("file", file);
    const result = await uploadCaravanImageAction(caravanId, data);
    setUploading(false);
    if (!result.success || !result.path) return toast.error(result.message);
    form.setValue(`itinerary.${index}.imagePath`, result.path, { shouldDirty: true, shouldValidate: true });
    if (result.url) setItineraryPreviews((current) => ({ ...current, [result.path as string]: result.url as string }));
    toast.success(`Imagem do dia ${form.getValues(`itinerary.${index}.day`)} enviada. Salve a caravana para confirmar.`);
  }

  const errors = form.formState.errors;
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {lastResult && !form.formState.isSubmitSuccessful ? <Alert variant="destructive"><AlertDescription>{lastResult}</AlertDescription></Alert> : null}
      <Tabs defaultValue="general" className="space-y-6">
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
          <Field label="Nome da caravana" error={errors.title?.message}><Input {...form.register("title")} /></Field>
          <Field label="Slug" error={errors.slug?.message}><Input {...form.register("slug")} /></Field>
          <Field label="Destino" error={errors.destination?.message}><Input {...form.register("destination")} /></Field>
          <Field label="Categoria"><Controller control={form.control} name="categoryId" render={({ field }) => <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="none">Sem categoria</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}{category.active ? "" : " (inativa)"}</SelectItem>)}</SelectContent></Select>} /></Field>
          <Field label="Tipo"><Input {...form.register("type")} placeholder="Cultural, religioso..." /></Field>
          <Field label="Duração" error={errors.duration?.message}><Input {...form.register("duration")} placeholder="14 dias" /></Field>
          <Field label="Preço textual"><Input {...form.register("price")} placeholder="Sob consulta" /></Field>
          <Field label="Moeda"><Input {...form.register("currency")} maxLength={3} /></Field>
          <div className="md:col-span-2"><Field label="Resumo" error={errors.summary?.message}><Textarea rows={3} {...form.register("summary")} /></Field></div>
          <div className="md:col-span-2"><Field label="Descrição" error={errors.description?.message}><Textarea rows={7} {...form.register("description")} /></Field></div>
        </Card></TabsContent>

        <TabsContent value="images"><Card className="space-y-6 rounded-[18px] border-leehov-border p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Path da imagem do card"><Input {...form.register("cardImagePath")} /></Field>
            <Field label="Path da imagem principal" error={errors.heroImagePath?.message}><Input {...form.register("heroImagePath")} /></Field>
            <Field label="Path da thumbnail de vídeo"><Input {...form.register("videoThumbnailPath")} /></Field>
            <Field label="URL do vídeo de fundo da Home" error={errors.videoUrl?.message}><Input {...form.register("videoUrl")} placeholder="YouTube, Vimeo ou arquivo HTTPS" /><p className="text-xs leading-5 text-leehov-muted">O vídeo é reproduzido sem som no Hero da Home; a imagem principal permanece como fallback.</p></Field>
          </div>
          <div className="rounded-xl border border-dashed border-leehov-blue-300 p-5">
            <Label htmlFor="caravan-upload">Enviar JPEG, PNG, WebP ou AVIF (até 8 MiB)</Label>
            <div className="mt-3 flex items-center gap-3"><Input id="caravan-upload" type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={!caravan || uploading} onChange={(event) => upload(event.target.files?.[0])} />{uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5 text-leehov-blue-500" />}</div>
            {!caravan ? <p className="mt-2 text-xs text-leehov-muted">Salve o rascunho para liberar uploads.</p> : null}
          </div>
          <div className="space-y-3"><Label>Galeria</Label>{images.fields.map((field, index) => <div key={field.id} className="grid gap-3 rounded-xl bg-leehov-surface p-4 md:grid-cols-[1fr_1fr_auto]"><Input {...form.register(`images.${index}.imagePath`)} placeholder="Path" /><Input {...form.register(`images.${index}.altText`)} placeholder="Texto alternativo" /><Button type="button" variant="outline" size="icon" onClick={() => removeImage(index)}><Trash2 className="size-4" /></Button></div>)}</div>
        </Card></TabsContent>

        <TabsContent value="departures"><Card className="space-y-4 rounded-[18px] border-leehov-border p-6">
          <div className="flex items-center justify-between"><div><h3 className="font-bold text-leehov-navy-950">Saídas e períodos</h3><p className="text-sm text-leehov-muted">Cadastre as opções na ordem de exibição.</p></div><Button type="button" variant="outline" onClick={() => departures.append({ id: "", label: "", startDate: "", endDate: "", availableSpots: null, status: "available", notes: "", orderIndex: departures.fields.length * 10 })}><Plus className="size-4" />Adicionar saída</Button></div>
          {departures.fields.map((field, index) => <div key={field.id} className="grid gap-4 rounded-xl bg-leehov-surface p-4 md:grid-cols-3"><Field label="Rótulo"><Input {...form.register(`departures.${index}.label`)} /></Field><Field label="Início"><Input type="date" {...form.register(`departures.${index}.startDate`)} /></Field><Field label="Fim"><Input type="date" {...form.register(`departures.${index}.endDate`)} /></Field><Field label="Vagas"><Input type="number" min={0} {...form.register(`departures.${index}.availableSpots`, { setValueAs: (value) => value === "" ? null : Number(value) })} /></Field><Field label="Status"><Controller control={form.control} name={`departures.${index}.status`} render={({ field: statusField }) => <Select value={statusField.value} onValueChange={statusField.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="available">Disponível</SelectItem><SelectItem value="coming_soon">Em breve</SelectItem><SelectItem value="waitlist">Lista de espera</SelectItem><SelectItem value="sold_out">Esgotada</SelectItem></SelectContent></Select>} /></Field><div className="flex items-end"><Button type="button" variant="outline" onClick={() => departures.remove(index)}><Trash2 className="size-4" />Remover</Button></div></div>)}
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
                    <Label htmlFor={`itinerary-upload-${index}`} className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-leehov-blue-600"><ImagePlus className="size-4" />Enviar imagem</Label>
                    <Input id={`itinerary-upload-${index}`} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/avif" disabled={!caravan || uploading} onChange={(event) => uploadItineraryImage(index, event.target.files?.[0])} />
                    {!caravan ? <p className="mt-2 text-xs text-leehov-muted">Salve o rascunho para liberar o upload.</p> : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-[110px_1fr_1fr_auto]">
                    <Field label="Dia"><Input type="number" min={1} {...form.register(`itinerary.${index}.day`, { valueAsNumber: true })} /></Field>
                    <Field label="Título" error={errors.itinerary?.[index]?.title?.message}><Input {...form.register(`itinerary.${index}.title`)} /></Field>
                    <Field label="Local"><Input {...form.register(`itinerary.${index}.location`)} /></Field>
                    <div className="flex items-end"><Button type="button" variant="outline" size="icon" aria-label={`Remover dia ${index + 1}`} onClick={() => itinerary.remove(index)}><Trash2 className="size-4" /></Button></div>
                    <div className="md:col-span-4"><Field label="Descrição"><Textarea rows={4} {...form.register(`itinerary.${index}.description`)} /></Field></div>
                    <div className="md:col-span-2"><Field label="Path da imagem"><Input {...form.register(`itinerary.${index}.imagePath`)} placeholder="Preenchido automaticamente no upload" /></Field></div>
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
          <Field label="Líder / acompanhamento"><Input {...form.register("leaderName")} /></Field><Field label="Path da foto do líder"><Input {...form.register("leaderImagePath")} /></Field><div className="md:col-span-2"><Field label="Apresentação do líder"><Textarea rows={5} {...form.register("leaderBio")} /></Field></div>
        </Card></TabsContent>

        <TabsContent value="seo"><Card className="grid gap-5 rounded-[18px] border-leehov-border p-6">
          <Field label="Título SEO"><Input {...form.register("seoTitle")} maxLength={70} /></Field><Field label="Descrição SEO"><Textarea {...form.register("seoDescription")} maxLength={180} /></Field>
        </Card></TabsContent>

        <TabsContent value="publication"><Card className="grid gap-5 rounded-[18px] border-leehov-border p-6 md:grid-cols-2">
          <Field label="Status" error={errors.status?.message}><Controller control={form.control} name="status" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Rascunho</SelectItem><SelectItem value="available">Disponível</SelectItem><SelectItem value="coming_soon">Em breve</SelectItem><SelectItem value="waitlist">Lista de espera</SelectItem><SelectItem value="sold_out">Esgotada</SelectItem></SelectContent></Select>} /></Field>
          <Field label="Ordem no Hero"><Input type="number" min={0} {...form.register("heroOrder", { valueAsNumber: true })} /></Field>
          <Controller control={form.control} name="published" render={({ field }) => <BooleanField label="Publicada" description="Torna a caravana visível no site." checked={field.value} onCheckedChange={field.onChange} />} />
          <Controller control={form.control} name="featuredHome" render={({ field }) => <BooleanField label="Destaque na Home" checked={field.value} onCheckedChange={field.onChange} />} />
          <Controller control={form.control} name="featuredHero" render={({ field }) => <BooleanField label="Destaque no Hero" checked={field.value} onCheckedChange={field.onChange} />} />
          <div className="md:col-span-2 grid gap-5 md:grid-cols-2"><Field label="Título do Hero" error={errors.heroTitle?.message}><Input {...form.register("heroTitle")} /></Field><Field label="Texto do botão"><Input {...form.register("heroCtaText")} /></Field><Field label="URL do botão"><Input {...form.register("heroCtaUrl")} /></Field><Field label="Descrição do Hero" error={errors.heroDescription?.message}><Textarea {...form.register("heroDescription")} /></Field></div>
        </Card></TabsContent>
      </Tabs>
      <div className="sticky bottom-5 z-20 flex justify-end"><Button type="submit" size="lg" disabled={form.formState.isSubmitting || uploading} className="rounded-full bg-leehov-blue-600 px-7 text-white shadow-leehov-floating hover:bg-leehov-cyan">{form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{form.formState.isSubmitting ? "Salvando..." : "Salvar caravana"}</Button></div>
    </form>
  );
}

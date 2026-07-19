"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Controller, useFieldArray, useForm, useWatch, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  GripVertical,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { removeBlogImageAction, saveBlogPostAction, uploadBlogImageAction } from "@/features/blog/actions";
import { BlogEditor } from "@/features/blog/components/blog-editor";
import { blogPostFormSchema, type BlogPostFormInput } from "@/features/blog/schema";
import { slugifyBlogTitle } from "@/features/blog/sanitize";
import { normalizeBlogGalleryOrder } from "@/features/blog/gallery";
import type { AdminBlogPost, BlogCategory } from "@/features/blog/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type RelatedCaravan = { id: string; title: string; destination: string };
type UploadResult = { key: string; name: string; status: "uploading" | "success" | "error"; message: string };
type SortableImage = BlogPostFormInput["images"][number] & { formKey: string };

function localDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function defaults(post?: AdminBlogPost): BlogPostFormInput {
  return {
    id: post?.id ?? "",
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    summary: post?.summary ?? "",
    content: post?.content ?? "",
    coverImagePath: post?.imagePath ?? "",
    coverAltText: post?.coverAltText ?? "",
    categoryId: post?.categoryId ?? "",
    relatedCaravanId: post?.relatedCaravan?.id ?? "",
    relatedDestination: post?.relatedDestination ?? "",
    author: post?.author ?? "Bruna Moraes",
    publishedAt: localDateTime(post?.publishedAt ?? ""),
    featuredHome: post?.featuredHome ?? false,
    featuredBlog: post?.featuredBlog ?? false,
    published: post?.published ?? false,
    seoTitle: post?.seoTitle ?? "",
    seoDescription: post?.seoDescription ?? "",
    images: post?.images.map((image, index) => ({
      id: image.id,
      imagePath: image.imagePath,
      altText: image.altText,
      caption: image.caption,
      orderIndex: index * 10,
    })) ?? [],
  };
}

function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs leading-5 text-leehov-muted">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

function BooleanField({ label, description, checked, onCheckedChange }: { label: string; description: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-leehov-border bg-white p-4">
      <div>
        <Label>{label}</Label>
        <p className="mt-1 text-xs leading-5 text-leehov-muted">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function SortableGalleryCard({
  image,
  index,
  total,
  preview,
  register,
  errors,
  onMove,
  onRemove,
}: {
  image: SortableImage;
  index: number;
  total: number;
  preview: string;
  register: UseFormRegister<BlogPostFormInput>;
  errors: FieldErrors<BlogPostFormInput>;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.formKey });
  const altError = errors.images?.[index]?.altText?.message;

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "grid gap-4 rounded-2xl border border-leehov-border bg-white p-4 shadow-sm sm:grid-cols-[148px_minmax(0,1fr)_auto]",
        isDragging && "relative z-20 opacity-75 shadow-leehov-floating",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-leehov-surface sm:aspect-auto sm:h-28">
        {preview ? <Image src={preview} alt="" fill unoptimized sizes="148px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-xs font-semibold text-leehov-muted">Sem preview</div>}
      </div>
      <div className="grid min-w-0 gap-3">
        <Field label={`Texto alternativo da imagem ${index + 1}`} error={typeof altError === "string" ? altError : undefined} htmlFor={`gallery-alt-${index}`}>
          <Input id={`gallery-alt-${index}`} {...register(`images.${index}.altText`)} placeholder="Descreva o conteúdo visual" aria-invalid={Boolean(altError)} />
        </Field>
        <Field label="Legenda" htmlFor={`gallery-caption-${index}`}>
          <Input id={`gallery-caption-${index}`} {...register(`images.${index}.caption`)} placeholder="Legenda exibida ao visitante (opcional)" />
        </Field>
        <Input type="hidden" {...register(`images.${index}.id`)} />
        <Input type="hidden" {...register(`images.${index}.imagePath`)} />
        <Input type="hidden" {...register(`images.${index}.orderIndex`, { valueAsNumber: true })} />
      </div>
      <div className="flex items-center gap-1 self-start sm:flex-col">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="cursor-grab touch-none active:cursor-grabbing"
          aria-label={`Reordenar imagem ${index + 1}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" disabled={index === 0} aria-label="Mover imagem para cima" onClick={() => onMove(index, index - 1)}>
          <ArrowUp className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" disabled={index === total - 1} aria-label="Mover imagem para baixo" onClick={() => onMove(index, index + 1)}>
          <ArrowDown className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label={`Remover imagem ${index + 1}`} onClick={() => onRemove(index)}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </article>
  );
}

export function BlogPostForm({ post, categories, caravans }: { post?: AdminBlogPost; categories: BlogCategory[]; caravans: RelatedCaravan[] }) {
  const router = useRouter();
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [coverPreview, setCoverPreview] = useState(post?.imageUrl ?? "");
  const [galleryPreviews, setGalleryPreviews] = useState<Record<string, string>>(() =>
    Object.fromEntries(post?.images.map((image) => [image.imagePath, image.imageUrl]) ?? []),
  );
  const form = useForm<BlogPostFormInput>({ resolver: zodResolver(blogPostFormSchema), defaultValues: defaults(post), mode: "onBlur" });
  const images = useFieldArray({ control: form.control, name: "images", keyName: "formKey" });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const title = useWatch({ control: form.control, name: "title" });
  const coverImagePath = useWatch({ control: form.control, name: "coverImagePath" });
  const isPublished = useWatch({ control: form.control, name: "published" });
  const isUploadingGallery = uploadResults.some((result) => result.status === "uploading");
  const sortableIds = useMemo(() => images.fields.map((image) => image.formKey), [images.fields]);

  useEffect(() => {
    if (!post && !form.getFieldState("slug").isDirty) form.setValue("slug", slugifyBlogTitle(title));
  }, [form, post, title]);

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= images.fields.length) return;
    images.move(from, to);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.fields.findIndex((image) => image.formKey === active.id);
    const newIndex = images.fields.findIndex((image) => image.formKey === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(images.fields, oldIndex, newIndex);
    images.replace(next.map((image, index) => ({
      id: image.id,
      imagePath: image.imagePath,
      altText: image.altText,
      caption: image.caption,
      orderIndex: index * 10,
    })));
  }

  async function onSubmit(input: BlogPostFormInput) {
    const normalizedInput = { ...input, images: normalizeBlogGalleryOrder(input.images) };
    const result = await saveBlogPostAction(normalizedInput);
    if (!result.success) return toast.error(result.message);
    toast.success(result.message);
    if (!input.id && result.id) router.push(`/admin/blog/${result.id}`);
    else router.refresh();
  }

  async function uploadCover(file?: File) {
    const postId = form.getValues("id");
    if (!postId) return toast.info("Salve o rascunho antes de enviar imagens.");
    if (!file) return;
    setUploadingCover(true);
    const data = new FormData();
    data.set("file", file);
    const result = await uploadBlogImageAction(postId, "cover", data);
    setUploadingCover(false);
    if (!result.success || !result.path) return toast.error(result.message);

    const previous = form.getValues("coverImagePath");
    form.setValue("coverImagePath", result.path, { shouldDirty: true });
    form.setValue("coverAltText", form.getValues("coverAltText") || title, { shouldDirty: true });
    setCoverPreview(result.url ?? "");
    if (previous && previous !== result.path) await removeBlogImageAction(postId, previous);
    toast.success("Capa adicionada. Salve o post para confirmar.");
  }

  async function uploadGallery(files: File[]) {
    const postId = form.getValues("id");
    if (!postId) return toast.info("Salve o rascunho antes de enviar imagens.");
    if (!files.length) return;

    const queued = files.map((file, index) => ({ key: `${file.name}-${file.lastModified}-${index}`, name: file.name, status: "uploading" as const, message: "Enviando..." }));
    setUploadResults(queued);

    for (const [index, file] of files.entries()) {
      const item = queued[index];
      const data = new FormData();
      data.set("file", file);
      const result = await uploadBlogImageAction(postId, "gallery", data);
      if (result.success && result.path) {
        images.append({ id: "", imagePath: result.path, altText: "", caption: "", orderIndex: images.fields.length * 10 });
        setGalleryPreviews((current) => ({ ...current, [result.path!]: result.url ?? "" }));
      }
      setUploadResults((current) => current.map((upload) => upload.key === item.key ? {
        ...upload,
        status: result.success ? "success" : "error",
        message: result.message,
      } : upload));
    }

    toast.success("Processamento concluído. Revise o resultado de cada arquivo.");
  }

  async function removeGallery(index: number) {
    const image = form.getValues(`images.${index}`);
    if (post && image.imagePath) {
      const result = await removeBlogImageAction(post.id, image.imagePath);
      if (!result.success) return toast.error(result.message);
    }
    images.remove(index);
    setGalleryPreviews((current) => {
      const next = { ...current };
      delete next[image.imagePath];
      return next;
    });
    toast.success("Imagem removida.");
  }

  async function removeCover() {
    const path = form.getValues("coverImagePath");
    if (post && path) {
      const result = await removeBlogImageAction(post.id, path);
      if (!result.success) return toast.error(result.message);
    }
    form.setValue("coverImagePath", "", { shouldDirty: true });
    setCoverPreview("");
  }

  const errors = form.formState.errors;
  const isBusy = form.formState.isSubmitting || uploadingCover || isUploadingGallery;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, () => toast.error("Revise os campos destacados antes de salvar."))}
      className="space-y-6"
    >
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-[16px] border border-leehov-border bg-white p-2 shadow-sm">
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="images">Imagens</TabsTrigger>
          <TabsTrigger value="relationships">Relacionamentos</TabsTrigger>
          <TabsTrigger value="publication">Publicação/SEO</TabsTrigger>
        </TabsList>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,808px)_minmax(300px,362px)]">
          <div className="min-w-0">
            <TabsContent value="content" className="mt-0">
              <Card className="grid gap-5 rounded-[18px] border-leehov-border p-6 md:grid-cols-2">
                <Field label="Título" error={errors.title?.message} htmlFor="blog-title"><Input id="blog-title" {...form.register("title")} /></Field>
                <Field label="Slug" error={errors.slug?.message} htmlFor="blog-slug"><Input id="blog-slug" {...form.register("slug")} /></Field>
                <div className="md:col-span-2"><Field label="Resumo" error={errors.summary?.message} hint="Texto usado nos cards e na introdução do artigo." htmlFor="blog-summary"><Textarea id="blog-summary" rows={4} maxLength={500} {...form.register("summary")} /></Field></div>
                <div className="md:col-span-2"><Field label="Conteúdo" error={errors.content?.message} hint="O servidor remove scripts, iframes, estilos inline e atributos inseguros."><Controller control={form.control} name="content" render={({ field }) => <BlogEditor value={field.value} onChange={field.onChange} />} /></Field></div>
              </Card>
            </TabsContent>

            <TabsContent value="images" className="mt-0 space-y-6">
              <Card className="rounded-[18px] border-leehov-border p-6">
                <div className="grid gap-6 md:grid-cols-[280px_1fr]">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-leehov-surface">
                    {coverPreview ? <Image src={coverPreview} alt="Preview da capa" fill unoptimized sizes="280px" className="object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-3 text-leehov-muted"><ImagePlus className="size-7" /><span className="text-sm font-semibold">Capa ainda não enviada</span></div>}
                  </div>
                  <div className="space-y-4">
                    <Field label="Capa do artigo" error={errors.coverImagePath?.message} hint="JPEG, PNG, WebP ou AVIF, até 8 MiB. Cada arquivo é validado no servidor.">
                      <Input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={!post || isBusy} onChange={(event) => { void uploadCover(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                    </Field>
                    {!post ? <p className="rounded-xl bg-leehov-surface p-3 text-xs text-leehov-muted">Salve o rascunho para liberar uploads.</p> : null}
                    {uploadingCover ? <p className="inline-flex items-center gap-2 text-sm font-semibold text-leehov-blue-600"><Loader2 className="size-4 animate-spin" />Enviando capa...</p> : null}
                    <Field label="Texto alternativo da capa" error={errors.coverAltText?.message} htmlFor="cover-alt"><Input id="cover-alt" {...form.register("coverAltText")} /></Field>
                    <Input type="hidden" {...form.register("coverImagePath")} />
                    {coverImagePath ? <Button type="button" variant="outline" onClick={removeCover}><Trash2 className="size-4" />Remover capa</Button> : null}
                  </div>
                </div>
              </Card>

              <Card className="rounded-[18px] border-leehov-border p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-extrabold text-leehov-navy-950">Galeria editorial</h3>
                    <p className="mt-1 text-sm leading-6 text-leehov-muted">Arraste para ordenar ou use os botões de mover. O texto alternativo é obrigatório para publicar.</p>
                  </div>
                  <Label className={cn("inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-leehov-blue-600 px-5 text-sm font-bold text-white transition hover:bg-leehov-cyan", (!post || isBusy) && "pointer-events-none opacity-50")}>
                    <UploadCloud className="size-4" />
                    Enviar imagens
                    <Input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" disabled={!post || isBusy} onChange={(event) => { void uploadGallery(Array.from(event.target.files ?? [])); event.currentTarget.value = ""; }} />
                  </Label>
                </div>

                {uploadResults.length ? (
                  <div className="mt-5 space-y-2 rounded-xl bg-leehov-surface p-4" aria-live="polite">
                    {uploadResults.map((result) => (
                      <div key={result.key} className="flex items-start gap-3 text-sm">
                        {result.status === "uploading" ? <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-leehov-blue-600" /> : result.status === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}
                        <p><span className="font-semibold text-leehov-navy-950">{result.name}</span><span className="text-leehov-muted"> — {result.message}</span></p>
                      </div>
                    ))}
                  </div>
                ) : null}

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                    <div className="mt-6 space-y-4">
                      {images.fields.map((image, index) => (
                        <SortableGalleryCard
                          key={image.formKey}
                          image={image}
                          index={index}
                          total={images.fields.length}
                          preview={galleryPreviews[image.imagePath] ?? ""}
                          register={form.register}
                          errors={errors}
                          onMove={moveImage}
                          onRemove={(imageIndex) => { void removeGallery(imageIndex); }}
                        />
                      ))}
                      {!images.fields.length ? <div className="rounded-2xl border border-dashed border-leehov-border px-6 py-12 text-center"><ImagePlus className="mx-auto size-7 text-leehov-blue-500" /><p className="mt-3 font-bold text-leehov-navy-950">Nenhuma imagem na galeria</p><p className="mt-1 text-sm text-leehov-muted">A capa permanece independente e não entra neste painel.</p></div> : null}
                    </div>
                  </SortableContext>
                </DndContext>
              </Card>
            </TabsContent>

            <TabsContent value="relationships" className="mt-0">
              <Card className="grid gap-5 rounded-[18px] border-leehov-border p-6 md:grid-cols-2">
                <div className="md:col-span-2"><p className="font-extrabold text-leehov-navy-950">Conexões editoriais</p><p className="mt-1 text-sm text-leehov-muted">Relacione o artigo a um destino e, quando aplicável, a uma caravana publicada.</p></div>
                <Field label="Destino relacionado" htmlFor="related-destination"><Input id="related-destination" {...form.register("relatedDestination")} placeholder="Israel, Egito, Tailândia..." /></Field>
                <div />
                <div className="md:col-span-2"><Field label="Caravana relacionada"><Controller control={form.control} name="relatedCaravanId" render={({ field }) => <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhuma caravana</SelectItem>{caravans.map((caravan) => <SelectItem key={caravan.id} value={caravan.id}>{caravan.title} · {caravan.destination}</SelectItem>)}</SelectContent></Select>} /></Field></div>
              </Card>
            </TabsContent>

            <TabsContent value="publication" className="mt-0">
              <Card className="grid gap-5 rounded-[18px] border-leehov-border p-6">
                <div><p className="font-extrabold text-leehov-navy-950">SEO do artigo</p><p className="mt-1 text-sm text-leehov-muted">Os campos abaixo substituem título e resumo somente nos mecanismos de busca e compartilhamentos.</p></div>
                <Field label="Título SEO" htmlFor="seo-title"><Input id="seo-title" maxLength={70} {...form.register("seoTitle")} placeholder="Usa o título do post quando vazio" /></Field>
                <Field label="Descrição SEO" htmlFor="seo-description"><Textarea id="seo-description" maxLength={180} rows={4} {...form.register("seoDescription")} placeholder="Usa o resumo quando vazio" /></Field>
              </Card>
            </TabsContent>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <Card className="rounded-[18px] border-leehov-border p-5">
              <div className="flex items-center justify-between gap-4">
                <div><p className="text-sm font-extrabold text-leehov-navy-950">Status editorial</p><p className="mt-1 text-xs text-leehov-muted">Visibilidade do artigo</p></div>
                <Badge variant={isPublished ? "default" : "outline"}>{isPublished ? "Publicado" : "Rascunho"}</Badge>
              </div>
              <div className="mt-5 space-y-4">
                <Field label="Categoria" error={errors.categoryId?.message}><Controller control={form.control} name="categoryId" render={({ field }) => <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="none">Sem categoria</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select>} /></Field>
                <Field label="Autoria" error={errors.author?.message} htmlFor="blog-author"><Input id="blog-author" {...form.register("author")} /></Field>
                <Field label="Data editorial" error={errors.publishedAt?.message} htmlFor="published-at"><Input id="published-at" type="datetime-local" {...form.register("publishedAt")} /></Field>
              </div>
            </Card>

            <Card className="space-y-3 rounded-[18px] border-leehov-border p-5">
              <Controller control={form.control} name="published" render={({ field }) => <BooleanField label="Publicado" description="Torna o artigo acessível no site." checked={field.value} onCheckedChange={field.onChange} />} />
              <Controller control={form.control} name="featuredBlog" render={({ field }) => <BooleanField label="Destaque no Blog" description="Exibe na abertura editorial." checked={field.value} onCheckedChange={field.onChange} />} />
              <Controller control={form.control} name="featuredHome" render={({ field }) => <BooleanField label="Destaque na Home" description="Exibe em Inspirações." checked={field.value} onCheckedChange={field.onChange} />} />
            </Card>

            <Card className="rounded-[18px] border-leehov-border p-5">
              <Button type="submit" size="lg" disabled={isBusy} className="w-full rounded-full bg-leehov-blue-600 text-white hover:bg-leehov-cyan">
                {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {form.formState.isSubmitting ? "Salvando..." : "Salvar post"}
              </Button>
              {post?.published ? <Button asChild variant="outline" className="mt-3 w-full rounded-full"><Link href={`/blog/${post.slug}`} target="_blank">Visualizar artigo <ExternalLink className="size-4" /></Link></Button> : null}
              {post?.sourceUrl ? <a href={post.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-leehov-blue-600 hover:text-leehov-cyan">Ver artigo de origem <ExternalLink className="size-3.5" /></a> : null}
            </Card>
          </aside>
        </div>
      </Tabs>
    </form>
  );
}

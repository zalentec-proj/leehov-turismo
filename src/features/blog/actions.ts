"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireActiveProfile } from "@/features/auth/queries";
import { blogCategorySchema, blogPostFormSchema, type BlogPostFormInput } from "@/features/blog/schema";
import { calculateReadingTime, sanitizeBlogHtml } from "@/features/blog/sanitize";
import { normalizeBlogGalleryOrder } from "@/features/blog/gallery";
import { validateBlogImage } from "@/features/blog/image-validation";
import type { BlogActionResult } from "@/features/blog/types";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/database";
import { emitWebhookEvent } from "@/lib/webhooks/events";

const emptyToNull = (value: string) => value.trim() || null;

function revalidateBlog(slug?: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin");
  revalidatePath("/admin/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
}

async function syncGallery(supabase: Awaited<ReturnType<typeof createClient>>, postId: string, images: BlogPostFormInput["images"]) {
  const rows = normalizeBlogGalleryOrder(images).map((image) => ({
    id: image.id || randomUUID(),
    blog_post_id: postId,
    image_url: image.imagePath,
    alt_text: emptyToNull(image.altText),
    caption: emptyToNull(image.caption),
    order_index: image.orderIndex,
  }));
  if (rows.length) {
    const { error } = await supabase.from("blog_post_images").upsert(rows);
    if (error) throw error;
  }
  let removal = supabase.from("blog_post_images").delete().eq("blog_post_id", postId);
  if (rows.length) removal = removal.not("id", "in", `(${rows.map((row) => row.id).join(",")})`);
  const { error } = await removal;
  if (error) throw error;
}

export async function saveBlogPostAction(rawInput: BlogPostFormInput): Promise<BlogActionResult> {
  const profile = await requireActiveProfile();
  const parsed = blogPostFormSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise os dados do post." };
  const input = parsed.data;
  const content = sanitizeBlogHtml(input.content);
  if (content.length < 50) return { success: false, message: "O conteúdo ficou muito curto após a sanitização." };
  const supabase = await createClient();
  const { data: duplicate, error: duplicateError } = await supabase.from("blog_posts").select("id").eq("slug", input.slug).neq("id", input.id || "00000000-0000-0000-0000-000000000000").maybeSingle();
  if (duplicateError) return { success: false, message: duplicateError.message };
  if (duplicate) return { success: false, message: "Já existe um post com este slug." };

  const publishedAt = input.publishedAt ? new Date(input.publishedAt).toISOString() : null;
  const payload = {
    title: input.title,
    slug: input.slug,
    summary: input.summary,
    content,
    cover_image_url: emptyToNull(input.coverImagePath),
    cover_alt_text: emptyToNull(input.coverAltText),
    category_id: input.categoryId || null,
    related_caravan_id: input.relatedCaravanId || null,
    related_destination: emptyToNull(input.relatedDestination),
    author: emptyToNull(input.author),
    reading_time: calculateReadingTime(content),
    featured_home: input.published ? input.featuredHome : false,
    featured_blog: input.published ? input.featuredBlog : false,
    published: input.published,
    published_at: publishedAt,
    seo_title: emptyToNull(input.seoTitle),
    seo_description: emptyToNull(input.seoDescription),
    updated_by: profile.id,
  };

  try {
    let postId = input.id;
    let wasPublished = false;
    if (postId) {
      const { data: current } = await supabase.from("blog_posts").select("published").eq("id", postId).single();
      wasPublished = current?.published ?? false;
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", postId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("blog_posts").insert({ ...payload, created_by: profile.id }).select("id").single();
      if (error) throw error;
      postId = data.id;
    }
    await syncGallery(supabase, postId, input.images);
    if (input.published && !wasPublished) await emitWebhookEvent("blog_post.published", { postId, slug: input.slug });
    revalidateBlog(input.slug);
    return { success: true, message: input.published ? "Post salvo e publicado." : "Rascunho salvo com sucesso.", id: postId };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Não foi possível salvar o post." };
  }
}

export async function setBlogPostPublishedAction(id: string, published: boolean): Promise<BlogActionResult> {
  const profile = await requireActiveProfile();
  const supabase = await createClient();
  const { data: post, error: loadError } = await supabase.from("blog_posts").select("id, slug, title, summary, content, category_id, author, cover_image_url, cover_alt_text, published_at, blog_post_images(alt_text)").eq("id", id).maybeSingle();
  if (loadError || !post) return { success: false, message: "Post não encontrado." };
  if (published && (!post.summary || post.summary.length < 30 || !post.content || post.content.length < 50 || !post.category_id || !post.author || !post.cover_image_url || !post.cover_alt_text)) {
    return { success: false, message: "Complete resumo, conteúdo, categoria, autoria, capa e texto alternativo antes de publicar." };
  }
  if (published && (post.blog_post_images ?? []).some((image) => !image.alt_text?.trim())) {
    return { success: false, message: "Informe o texto alternativo de todas as imagens da galeria antes de publicar." };
  }
  const updates: TablesUpdate<"blog_posts"> = {
    published,
    updated_by: profile.id,
    published_at: published ? post.published_at ?? new Date().toISOString() : post.published_at,
  };
  if (!published) {
    updates.featured_home = false;
    updates.featured_blog = false;
  }
  const { error } = await supabase.from("blog_posts").update(updates).eq("id", id);
  if (error) return { success: false, message: error.message };
  if (published) await emitWebhookEvent("blog_post.published", { postId: id, slug: post.slug });
  revalidateBlog(post.slug);
  return { success: true, message: published ? "Post publicado." : "Post despublicado e removido dos destaques." };
}

export async function deleteDraftBlogPostAction(id: string): Promise<BlogActionResult> {
  await requireActiveProfile();
  const supabase = await createClient();
  const { data: post, error } = await supabase.from("blog_posts").select("slug, published, cover_image_url, blog_post_images(image_url)").eq("id", id).maybeSingle();
  if (error || !post) return { success: false, message: "Post não encontrado." };
  if (post.published) return { success: false, message: "Despublique o post antes de excluí-lo." };
  const paths = [post.cover_image_url, ...(post.blog_post_images ?? []).map((image) => image.image_url)].filter((path): path is string => Boolean(path));
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from("blog-images").remove(paths);
    if (storageError) return { success: false, message: storageError.message };
  }
  const { error: deleteError } = await supabase.from("blog_posts").delete().eq("id", id).eq("published", false);
  if (deleteError) return { success: false, message: deleteError.message };
  revalidateBlog(post.slug);
  return { success: true, message: "Rascunho e imagens excluídos." };
}

export async function saveBlogCategoryAction(formData: FormData): Promise<void> {
  await requireActiveProfile();
  const parsed = blogCategorySchema.safeParse({
    id: formData.get("id") ?? "",
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return;
  const supabase = await createClient();
  const payload = { name: parsed.data.name, slug: parsed.data.slug, description: emptyToNull(parsed.data.description) };
  if (parsed.data.id) await supabase.from("blog_categories").update(payload).eq("id", parsed.data.id);
  else await supabase.from("blog_categories").insert(payload);
  revalidatePath("/admin/blog");
  revalidatePath("/admin/blog/novo");
}

export async function uploadBlogImageAction(postId: string, kind: "cover" | "gallery", formData: FormData): Promise<BlogActionResult> {
  await requireActiveProfile();
  const file = formData.get("file");
  if (!(file instanceof File)) return { success: false, message: "Selecione uma imagem." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateBlogImage(file.type, file.size, bytes);
  if (!validation.success) return validation;
  const supabase = await createClient();
  const { data: post } = await supabase.from("blog_posts").select("id").eq("id", postId).maybeSingle();
  if (!post) return { success: false, message: "Salve o rascunho antes de enviar imagens." };
  const path = `${postId}/${kind}/${randomUUID()}.${validation.extension}`;
  const { error } = await supabase.storage.from("blog-images").upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) return { success: false, message: error.message };
  const { data } = await supabase.storage.from("blog-images").createSignedUrl(path, 3600);
  return { success: true, message: "Imagem enviada com sucesso.", path, url: data?.signedUrl };
}

export async function removeBlogImageAction(postId: string, path: string): Promise<BlogActionResult> {
  const profile = await requireActiveProfile();
  if (!path.startsWith(`${postId}/cover/`) && !path.startsWith(`${postId}/gallery/`)) return { success: false, message: "Caminho de imagem inválido." };
  const supabase = await createClient();
  const { data: post } = await supabase.from("blog_posts").select("slug, cover_image_url").eq("id", postId).maybeSingle();
  if (!post) return { success: false, message: "Post não encontrado." };
  const { error } = await supabase.storage.from("blog-images").remove([path]);
  if (error) return { success: false, message: error.message };
  await supabase.from("blog_post_images").delete().eq("blog_post_id", postId).eq("image_url", path);
  if (post.cover_image_url === path) await supabase.from("blog_posts").update({ cover_image_url: null, cover_alt_text: null, updated_by: profile.id }).eq("id", postId);
  revalidateBlog(post.slug);
  return { success: true, message: "Imagem removida." };
}

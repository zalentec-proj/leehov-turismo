import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const APPLY_CONFIRMATION = "RESTORE_WORDPRESS_BLOG_ORIGINALS";
const apply = process.argv.includes("--apply");
const forceGallery = process.argv.includes("--force-gallery");
const postFilter = process.argv.find((argument) => argument.startsWith("--post="))?.slice("--post=".length);

function loadLocalEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (!match) continue;
      process.env[match[1].trim()] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
    }
  } catch {
    // Variáveis já fornecidas pelo ambiente continuam sendo aceitas.
  }
}

function decodeHtmlUrl(value) {
  return value.replaceAll("&amp;", "&").replaceAll("&#038;", "&");
}

function wordpressOriginalUrl(value) {
  const url = new URL(decodeHtmlUrl(value));
  url.pathname = url.pathname.replace(/-\d+x\d+(?=\.(?:avif|jpe?g|png|webp)$)/i, "");
  return url.toString();
}

function extractContentImageUrls(html) {
  return [...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((url) => url.startsWith("http"))
    .map(wordpressOriginalUrl);
}

function sourceSlug(sourceUrl) {
  return new URL(sourceUrl).pathname.split("/").filter(Boolean).at(-1);
}

async function fetchWordPressPostSnapshot(sourceUrl) {
  const slug = sourceSlug(sourceUrl);
  const endpoint = new URL("/wp-json/wp/v2/posts", sourceUrl);
  endpoint.searchParams.set("slug", slug);
  endpoint.searchParams.set("_embed", "wp:featuredmedia");
  const response = await fetch(endpoint, { headers: { "user-agent": "Leehov image restoration audit" } });
  if (!response.ok) throw new Error(`WordPress respondeu ${response.status} para ${slug}.`);
  const posts = await response.json();
  const post = posts[0];
  if (!post) throw new Error(`Post ${slug} não encontrado na API do WordPress.`);
  const contentImages = extractContentImageUrls(post.content?.rendered ?? "");
  const featured = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  return { coverUrl: featured ? wordpressOriginalUrl(featured) : contentImages[0], contentImages };
}

function arraysEqual(first, second) {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function haveSameImages(first, second) {
  if (first.length !== second.length) return false;
  return arraysEqual([...first].sort(), [...second].sort());
}

async function fetchWordPressPost(sourceUrl) {
  const first = await fetchWordPressPostSnapshot(sourceUrl);
  const second = await fetchWordPressPostSnapshot(sourceUrl);
  const galleryOrderStable = arraysEqual(first.contentImages, second.contentImages);
  const galleryImagesStable = haveSameImages(first.contentImages, second.contentImages);

  return {
    coverUrl: first.coverUrl,
    contentImages: galleryOrderStable ? first.contentImages : [...first.contentImages].sort(),
    galleryImagesStable,
    galleryOrderStable,
  };
}

async function fetchImage(url) {
  const response = await fetch(url, { headers: { "user-agent": "Leehov image restoration audit" } });
  if (!response.ok) throw new Error(`Origem respondeu ${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(bytes, { failOn: "error" }).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Dimensões ausentes: ${url}`);
  return {
    bytes,
    contentType: response.headers.get("content-type")?.split(";")[0] || "image/jpeg",
    height: metadata.height,
    width: metadata.width,
  };
}

async function inspectStoredImage(supabase, path) {
  const { data, error } = await supabase.storage.from("blog-images").download(path);
  if (error || !data) throw new Error(`Não foi possível ler ${path}: ${error?.message ?? "arquivo ausente"}`);
  const bytes = Buffer.from(await data.arrayBuffer());
  const metadata = await sharp(bytes, { failOn: "error" }).metadata();
  return { bytes, height: metadata.height ?? 0, width: metadata.width ?? 0 };
}

function hasMorePixels(candidate, current) {
  return candidate.width * candidate.height > current.width * current.height;
}

loadLocalEnv();

if (apply && process.env.BLOG_IMAGE_RESTORE_CONFIRM !== APPLY_CONFIRMATION) {
  console.error(`Para gravar, defina BLOG_IMAGE_RESTORE_CONFIRM=${APPLY_CONFIRMATION} e repita com --apply.`);
  process.exit(2);
}

if (forceGallery && !postFilter) {
  console.error("--force-gallery exige --post=<slug> para limitar a regravação a uma única galeria.");
  process.exit(2);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !supabaseSecret) {
  console.error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórias para a auditoria.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let postsQuery = supabase
  .from("blog_posts")
  .select("id, slug, source_url, cover_image_url, blog_post_images(id, image_url, order_index)")
  .not("source_url", "is", null)
  .order("slug");
if (postFilter) postsQuery = postsQuery.eq("slug", postFilter);

const { data: posts, error: postsError } = await postsQuery;
if (postsError) throw postsError;

const report = [];
let writesPerformed = 0;

for (const post of posts ?? []) {
  const item = { slug: post.slug, replacements: [], skipped: [] };
  try {
    const source = await fetchWordPressPost(post.source_url);
    const gallery = [...(post.blog_post_images ?? [])].sort((a, b) => a.order_index - b.order_index);
    const candidates = [];

    if (post.cover_image_url && source.coverUrl) {
      candidates.push({ kind: "cover", path: post.cover_image_url, sourceUrl: source.coverUrl });
    }

    const canRestoreGallery = source.galleryOrderStable || (forceGallery && source.galleryImagesStable);

    if (!source.galleryImagesStable) {
      item.skipped.push("Galeria preservada: o WordPress retornou conjuntos de imagens diferentes entre duas leituras.");
    } else if (!canRestoreGallery) {
      item.skipped.push("Galeria preservada: o WordPress embaralha a ordem das imagens; use --force-gallery com --post para estabilizá-la.");
    } else if (gallery.length !== source.contentImages.length) {
      item.skipped.push(`Galeria preservada: banco tem ${gallery.length} imagens e WordPress retornou ${source.contentImages.length}.`);
    } else {
      gallery.forEach((image, index) => candidates.push({
        force: forceGallery,
        kind: `gallery-${index + 1}`,
        path: image.image_url,
        sourceUrl: source.contentImages[index],
      }));
    }

    for (const candidate of candidates) {
      try {
        const [current, original] = await Promise.all([
          inspectStoredImage(supabase, candidate.path),
          fetchImage(candidate.sourceUrl),
        ]);
        if (current.bytes.equals(original.bytes)) {
          item.skipped.push(`${candidate.kind}: arquivo já corresponde ao original.`);
          continue;
        }
        if (!candidate.force && !hasMorePixels(original, current)) {
          item.skipped.push(`${candidate.kind}: original ${original.width}×${original.height} não supera ${current.width}×${current.height}.`);
          continue;
        }
        item.replacements.push({
          kind: candidate.kind,
          path: candidate.path,
          current: `${current.width}×${current.height}`,
          original: `${original.width}×${original.height}`,
        });
        if (apply) {
          const { error } = await supabase.storage.from("blog-images").upload(candidate.path, original.bytes, {
            cacheControl: "31536000",
            contentType: original.contentType,
            upsert: true,
          });
          if (error) throw error;
          writesPerformed += 1;
        }
      } catch (error) {
        item.skipped.push(`${candidate.kind}: ${error instanceof Error ? error.message : "falha desconhecida"}`);
      }
    }
  } catch (error) {
    item.skipped.push(error instanceof Error ? error.message : "Falha desconhecida no post.");
  }
  report.push(item);
}

console.log(JSON.stringify({
  mode: apply ? "apply" : "dry-run",
  postsInspected: report.length,
  replacementsFound: report.reduce((total, post) => total + post.replacements.length, 0),
  writesPerformed,
  report,
}, null, 2));

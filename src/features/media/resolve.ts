import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type MediaBucket = "site-media" | "caravan-images" | "blog-images";

export async function resolveMediaUrls(
  paths: Array<string | null | undefined>,
  fallbackBucket: MediaBucket,
  expiresIn = 3600,
): Promise<ReadonlyMap<string, string>> {
  const uniquePaths = [...new Set(paths.filter((path): path is string => Boolean(path) && !path?.startsWith("/") && !/^https?:\/\//i.test(path ?? "")))];
  if (!uniquePaths.length) return new Map();

  const admin = createAdminClient();
  const { data: catalog } = await admin.from("media_assets").select("storage_path, storage_bucket").in("storage_path", uniquePaths);
  const bucketByPath = new Map((catalog ?? []).map((asset) => [asset.storage_path, asset.storage_bucket as MediaBucket]));
  const groups = new Map<MediaBucket, string[]>();
  for (const path of uniquePaths) {
    const bucket = bucketByPath.get(path) ?? fallbackBucket;
    groups.set(bucket, [...(groups.get(bucket) ?? []), path]);
  }

  const output = new Map<string, string>();
  await Promise.all([...groups].map(async ([bucket, bucketPaths]) => {
    const { data } = await admin.storage.from(bucket).createSignedUrls(bucketPaths, expiresIn);
    for (const asset of data ?? []) if (asset.path && asset.signedUrl) output.set(asset.path, asset.signedUrl);
  }));
  return output;
}

export async function resolveMediaUrl(path: string | null | undefined, fallbackBucket: MediaBucket, expiresIn = 3600) {
  if (!path) return "";
  if (path.startsWith("/")) return path;
  if (/^https?:\/\//i.test(path)) return "";
  return (await resolveMediaUrls([path], fallbackBucket, expiresIn)).get(path) ?? "";
}

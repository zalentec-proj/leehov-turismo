import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type MediaBucket = "site-media" | "caravan-images" | "blog-images";

export async function resolveMediaUrls(
  paths: Array<string | null | undefined>,
  fallbackBucket: MediaBucket,
  _expiresIn = 3600,
): Promise<ReadonlyMap<string, string>> {
  void _expiresIn;
  const uniquePaths = [...new Set(paths.filter((path): path is string => Boolean(path) && !path?.startsWith("/") && !/^https?:\/\//i.test(path ?? "")))];
  if (!uniquePaths.length) return new Map();

  const admin = createAdminClient();
  const { data: catalog } = await admin.from("media_assets").select("id, storage_path, storage_bucket").in("storage_path", uniquePaths);
  const assetByPath = new Map((catalog ?? []).map((asset) => [asset.storage_path, asset]));
  const groups = new Map<MediaBucket, string[]>();
  for (const path of uniquePaths) {
    const asset = assetByPath.get(path);
    if (asset) continue;
    const bucket = fallbackBucket;
    groups.set(bucket, [...(groups.get(bucket) ?? []), path]);
  }

  const output = new Map(
    [...assetByPath].map(([path, asset]) => [path, `/api/media/${asset.id}`]),
  );
  for (const [bucket, bucketPaths] of groups) {
    for (const path of bucketPaths) {
      const encodedPath = path.split("/").map(encodeURIComponent).join("/");
      output.set(path, `/api/media/legacy/${bucket}/${encodedPath}`);
    }
  }
  return output;
}

export async function resolveMediaUrl(path: string | null | undefined, fallbackBucket: MediaBucket, expiresIn = 3600) {
  if (!path) return "";
  if (path.startsWith("/")) return path;
  if (/^https?:\/\//i.test(path)) return "";
  return (await resolveMediaUrls([path], fallbackBucket, expiresIn)).get(path) ?? "";
}

import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createAdminClient } from "@/lib/supabase/admin";

export type MediaStorageProvider = "supabase" | "r2";

type MediaObject = {
  bytes: Uint8Array;
  contentType: string;
};

type MediaObjectAddress = {
  bucket: string;
  path: string;
  provider?: MediaStorageProvider | null;
};

function configuredUploadProvider(): MediaStorageProvider {
  return process.env.MEDIA_STORAGE_PROVIDER === "r2" ? "r2" : "supabase";
}

function normalizedProvider(provider?: MediaStorageProvider | null) {
  return provider === "r2" ? "r2" : "supabase";
}

function r2ObjectKey(bucket: string, path: string) {
  return `${bucket}/${path}`;
}

function r2Configuration() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("O armazenamento R2 ainda não está configurado no servidor.");
  }
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

let r2Client: S3Client | null = null;

function getR2Client() {
  const config = r2Configuration();
  r2Client ??= new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return { client: r2Client, bucket: config.bucket };
}

export function getMediaUploadProvider() {
  return configuredUploadProvider();
}

export async function downloadMediaObject(address: MediaObjectAddress): Promise<MediaObject | null> {
  if (normalizedProvider(address.provider) === "r2") {
    try {
      const { client, bucket } = getR2Client();
      const result = await client.send(new GetObjectCommand({
        Bucket: bucket,
        Key: r2ObjectKey(address.bucket, address.path),
      }));
      if (!result.Body) return null;
      return {
        bytes: await result.Body.transformToByteArray(),
        contentType: result.ContentType ?? "application/octet-stream",
      };
    } catch {
      return null;
    }
  }

  const { data, error } = await createAdminClient().storage
    .from(address.bucket)
    .download(address.path);
  if (error || !data) return null;
  return {
    bytes: new Uint8Array(await data.arrayBuffer()),
    contentType: data.type,
  };
}

export async function uploadMediaObject(
  address: MediaObjectAddress,
  bytes: Uint8Array,
  contentType: string,
) {
  if (normalizedProvider(address.provider) === "r2") {
    const { client, bucket } = getR2Client();
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: r2ObjectKey(address.bucket, address.path),
      Body: bytes,
      ContentLength: bytes.byteLength,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }));
    return;
  }

  const { error } = await createAdminClient().storage.from(address.bucket).upload(
    address.path,
    bytes,
    { cacheControl: "31536000", contentType, upsert: false },
  );
  if (error) throw error;
}

export async function removeMediaObject(address: MediaObjectAddress) {
  if (normalizedProvider(address.provider) === "r2") {
    const { client, bucket } = getR2Client();
    await client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: r2ObjectKey(address.bucket, address.path),
    }));
    return;
  }

  const { error } = await createAdminClient().storage
    .from(address.bucket)
    .remove([address.path]);
  if (error) throw error;
}

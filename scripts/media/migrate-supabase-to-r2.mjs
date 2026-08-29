import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local") && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env.local");
}

const projectRef = "awfcyrpuzhovxixzpqzv";
const execute = process.argv.includes("--execute");
const confirmation = process.argv.find((item) => item.startsWith("--confirm-project="))?.split("=")[1];
const buckets = ["site-media", "caravan-images", "blog-images"];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseUrl.includes(projectRef)) {
  throw new Error("A URL do Supabase não pertence ao projeto de produção esperado.");
}
if (execute && confirmation !== projectRef) {
  throw new Error(`A execução remota exige --confirm-project=${projectRef}.`);
}

const supabase = createClient(supabaseUrl, required("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const r2Bucket = required("R2_BUCKET");
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${required("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: required("R2_ACCESS_KEY_ID"),
    secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
  },
});

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function listObjects(bucket, prefix = "") {
  const output = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    const page = data ?? [];
    for (const item of page) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) output.push({ bucket, path, metadata: item.metadata ?? {} });
      else output.push(...await listObjects(bucket, path));
    }
    if (page.length < 1000) break;
    offset += page.length;
  }
  return output;
}

async function readR2Body(command) {
  const result = await r2.send(command);
  if (!result.Body) throw new Error("O R2 devolveu um objeto sem conteúdo.");
  return Buffer.from(await result.Body.transformToByteArray());
}

const objects = (await Promise.all(buckets.map((bucket) => listObjects(bucket)))).flat();
const summary = {
  mode: execute ? "execute" : "dry-run",
  projectRef,
  objects: objects.length,
  bytes: 0,
  copied: 0,
  catalogUpdated: 0,
  uncatalogued: 0,
  failed: [],
};

for (const [index, object] of objects.entries()) {
  const { data, error } = await supabase.storage.from(object.bucket).download(object.path);
  if (error || !data) {
    summary.failed.push({ bucket: object.bucket, path: object.path, stage: "download" });
    continue;
  }

  const bytes = Buffer.from(await data.arrayBuffer());
  const sha256 = digest(bytes);
  const contentType = data.type || object.metadata.mimetype || "application/octet-stream";
  summary.bytes += bytes.byteLength;

  if (execute) {
    try {
      const key = `${object.bucket}/${object.path}`;
      await r2.send(new PutObjectCommand({
        Bucket: r2Bucket,
        Key: key,
        Body: bytes,
        ContentLength: bytes.byteLength,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
        Metadata: { sha256 },
      }));
      const copied = await readR2Body(new GetObjectCommand({ Bucket: r2Bucket, Key: key }));
      if (copied.byteLength !== bytes.byteLength || digest(copied) !== sha256) {
        throw new Error("Falha na verificação de integridade.");
      }

      summary.copied += 1;
      const { data: catalogRows, error: updateError } = await supabase
        .from("media_assets")
        .update({
          storage_provider: "r2",
          content_sha256: sha256,
          storage_migrated_at: new Date().toISOString(),
        })
        .eq("storage_bucket", object.bucket)
        .eq("storage_path", object.path)
        .select("id");
      if (updateError) throw updateError;
      if (catalogRows?.length) summary.catalogUpdated += catalogRows.length;
      else summary.uncatalogued += 1;
    } catch (migrationError) {
      summary.failed.push({
        bucket: object.bucket,
        path: object.path,
        stage: "copy-or-verify",
        error: migrationError instanceof Error ? migrationError.message : "Erro desconhecido",
      });
    }
  }

  if ((index + 1) % 25 === 0 || index + 1 === objects.length) {
    console.log(`[${index + 1}/${objects.length}] ${object.bucket}/${object.path}`);
  }
}

console.log(JSON.stringify(summary, null, 2));
if (!execute) {
  console.log(`Dry-run concluído. Para gravar, use --execute --confirm-project=${projectRef}.`);
}
if (summary.failed.length) process.exitCode = 1;

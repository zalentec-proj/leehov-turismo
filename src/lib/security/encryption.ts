import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";

function readKey(variableName: string) {
  const raw = process.env[variableName]?.trim();
  if (!raw) throw new Error(`A variável ${variableName} não está configurada.`);

  const key = /^[0-9a-f]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");

  if (key.length !== 32) {
    throw new Error(`${variableName} deve conter exatamente 32 bytes em base64 ou hexadecimal.`);
  }

  return key;
}

export function hasEncryptionKey(variableName: string) {
  try {
    readKey(variableName);
    return true;
  } catch {
    return false;
  }
}

export function encryptSecret(value: string, variableName: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", readKey(variableName), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptSecret(value: string, variableName: string) {
  const [version, encodedIv, encodedTag, encodedCiphertext] = value.split(".");
  if (version !== VERSION || !encodedIv || !encodedTag || !encodedCiphertext) {
    throw new Error("O segredo armazenado usa um formato inválido.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    readKey(variableName),
    Buffer.from(encodedIv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

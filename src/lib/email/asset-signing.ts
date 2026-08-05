import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  return process.env.EMAIL_ASSET_SIGNING_SECRET?.trim() || "";
}

export function createEmailAssetToken(assetId: string) {
  if (!secret()) return "";
  return createHmac("sha256", secret()).update(`email-asset:${assetId}`).digest("base64url");
}

export function verifyEmailAssetToken(assetId: string, token: string) {
  const expected = createEmailAssetToken(assetId);
  if (!expected || !token) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(token);
  return left.length === right.length && timingSafeEqual(left, right);
}

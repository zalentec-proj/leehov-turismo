import "server-only";

import { timingSafeEqual } from "node:crypto";

const MAX_ADMIN_JSON_BODY_BYTES = 64 * 1024;

function normalizeOrigin(value: string) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

/**
 * API routes used from the authenticated administration panel must not accept
 * cross-site form submissions. Supabase's same-site session cookies are one
 * layer of protection; validating Origin adds an explicit CSRF boundary.
 */
export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const expectedOrigin = `${forwardedProto || requestUrl.protocol.replace(":", "")}://${forwardedHost || requestUrl.host}`;

  return normalizeOrigin(origin) === normalizeOrigin(expectedOrigin);
}

export function isSafeAdminJsonRequest(request: Request) {
  if (!hasSameOrigin(request)) return false;
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) return false;
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  return Number.isFinite(contentLength) && contentLength >= 0 && contentLength <= MAX_ADMIN_JSON_BODY_BYTES;
}

/**
 * Parse small JSON payloads only after the CSRF/content-type checks. The
 * content-length header is useful as an early rejection, but it is supplied
 * by the client and cannot be the only body-size guard.
 */
export async function parseSafeAdminJson<T>(request: Request): Promise<T | null> {
  if (!isSafeAdminJsonRequest(request)) return null;

  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > MAX_ADMIN_JSON_BODY_BYTES) return null;

  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

export function secretsMatch(provided: string | null | undefined, expected: string | null | undefined) {
  if (!provided || !expected) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

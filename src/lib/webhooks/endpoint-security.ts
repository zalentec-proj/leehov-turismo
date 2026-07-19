import "server-only";

import { resolve4, resolve6 } from "node:dns/promises";
import { isIP } from "node:net";

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0
    || a === 10
    || a === 127
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 100 && b >= 64 && b <= 127)
    || a >= 224;
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mapped ? isPrivateIpv4(mapped) : false;
}

function assertPublicAddress(address: string) {
  if (isIP(address) === 4 && isPrivateIpv4(address)) throw new Error("A URL aponta para uma rede IPv4 privada ou reservada.");
  if (isIP(address) === 6 && isPrivateIpv6(address)) throw new Error("A URL aponta para uma rede IPv6 privada ou reservada.");
}

export async function assertSafeWebhookUrl(value: string) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Use uma URL HTTP ou HTTPS.");
  if (url.username || url.password) throw new Error("A URL não pode conter credenciais.");
  if (url.hash) throw new Error("A URL não pode conter fragmentos.");

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const localNames = ["localhost", "metadata.google.internal", "metadata", "host.docker.internal"];
  if (localNames.includes(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("A URL aponta para um host interno.");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("Webhooks em produção exigem HTTPS.");
  }

  if (isIP(hostname)) {
    assertPublicAddress(hostname);
  } else {
    const [ipv4, ipv6] = await Promise.all([
      resolve4(hostname).catch(() => [] as string[]),
      resolve6(hostname).catch(() => [] as string[]),
    ]);
    const addresses = [...ipv4, ...ipv6];
    if (!addresses.length) throw new Error("O domínio do webhook não pôde ser resolvido.");
    addresses.forEach(assertPublicAddress);
  }

  return url;
}

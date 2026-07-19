import "server-only";

type TurnstileResponse = {
  success: boolean;
  hostname?: string;
  "error-codes"?: string[];
};

export type TurnstileVerification = {
  success: boolean;
  skipped: boolean;
  configurationError?: boolean;
  errors?: string[];
};

export function getTurnstileMode() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!siteKey && !secret) return "disabled" as const;
  if (!siteKey || !secret) return "invalid" as const;
  return "enabled" as const;
}

export async function verifyTurnstileToken(token?: string, remoteIp?: string): Promise<TurnstileVerification> {
  const mode = getTurnstileMode();

  if (mode === "disabled") return { success: true, skipped: true };
  if (mode === "invalid") return { success: false, skipped: false, configurationError: true };

  if (!token) {
    return { success: false, skipped: false };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY as string;
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
      },
    );

    if (!response.ok) return { success: false, skipped: false, errors: ["verification-unavailable"] };

    const data = (await response.json()) as TurnstileResponse;
    return { success: data.success, skipped: false, errors: data["error-codes"] };
  } catch {
    return { success: false, skipped: false, errors: ["verification-unavailable"] };
  }
}

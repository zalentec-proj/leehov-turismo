import "server-only";
import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendApiKey() {
  return process.env.RESEND_API_KEY_LOCAL?.trim() || process.env.RESEND_API_KEY?.trim() || "";
}

export function getResendClient() {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  resendClient ??= new Resend(apiKey);
  return resendClient;
}

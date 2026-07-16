export function getSupabasePublicEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function hasSupabasePublicEnv() {
  const { url, publishableKey } = getSupabasePublicEnv();
  return Boolean(url && publishableKey);
}

export function requireSupabasePublicEnv() {
  const env = getSupabasePublicEnv();

  if (!env.url || !env.publishableKey) {
    throw new Error(
      "Supabase public env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return env as { url: string; publishableKey: string };
}

export function requireSupabaseSecretKey() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is missing.");
  }

  return secretKey;
}

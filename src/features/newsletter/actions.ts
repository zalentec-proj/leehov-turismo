"use server";

export async function subscribeNewsletterAction() {
  return {
    success: false,
    message:
      "Newsletter double opt-in sera ativada quando Supabase e Resend estiverem configurados.",
  };
}

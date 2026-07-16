"use server";

export async function testWebhookAction() {
  return {
    success: false,
    message: "Teste de webhook sera ativado com Supabase e route handler.",
  };
}

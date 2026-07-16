"use server";

export async function sendTestEmailAction() {
  return {
    success: false,
    message: "Envio real depende de RESEND_API_KEY e dominio verificado.",
  };
}

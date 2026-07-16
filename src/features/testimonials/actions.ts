"use server";

export async function syncGoogleReviewsAction() {
  return {
    success: false,
    message:
      "Sincronizacao do Google Business Profile depende de credenciais OAuth.",
  };
}

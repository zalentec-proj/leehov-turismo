"use server";

export async function publishBlogPostAction() {
  return {
    success: false,
    message: "Publicacao de posts sera ativada apos migrations e admin base.",
  };
}

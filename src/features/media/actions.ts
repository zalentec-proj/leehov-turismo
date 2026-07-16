"use server";

export async function registerMediaAssetAction() {
  return {
    success: false,
    message: "Upload e biblioteca de midia dependem do Storage configurado.",
  };
}

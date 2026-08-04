import "server-only";

import { getGooglePlacesConfiguration } from "@/lib/google/places";
import {
  mapGooglePlacesReviews,
  type GooglePlacesApiResponse,
  type GooglePlacesReviews,
} from "@/features/testimonials/google-places-utils";

export type GooglePlacesLoadResult = GooglePlacesReviews & {
  configured: boolean;
  error: string;
};

const emptyResult: GooglePlacesLoadResult = {
  configured: false,
  error: "",
  placeName: "",
  googleMapsUrl: "",
  rating: 0,
  userRatingCount: 0,
  reviews: [],
};

export async function getGooglePlacesReviews(): Promise<GooglePlacesLoadResult> {
  const configuration = getGooglePlacesConfiguration();
  if (!configuration.configured)
    return {
      ...emptyResult,
      error: "A Places API ainda não está configurada no servidor.",
    };

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(configuration.placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": configuration.apiKey,
          "X-Goog-FieldMask":
            "displayName,googleMapsUri,rating,userRatingCount,reviews",
        },
        cache: "no-store",
      },
    );
    const payload = (await response.json()) as GooglePlacesApiResponse & {
      error?: { message?: string };
    };
    if (!response.ok)
      throw new Error(
        payload.error?.message ||
          `A Places API respondeu com status ${response.status}.`,
      );
    return {
      configured: true,
      error: "",
      ...mapGooglePlacesReviews(configuration.placeId, payload),
    };
  } catch (error) {
    return {
      ...emptyResult,
      configured: true,
      error:
        error instanceof Error
          ? error.message.slice(0, 300)
          : "Não foi possível consultar a Places API.",
    };
  }
}

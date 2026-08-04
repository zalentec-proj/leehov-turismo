import type { GoogleReview } from "@/features/testimonials/types";

export type GooglePlacesApiResponse = {
  displayName?: { text?: string };
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  reviews?: Array<{
    name?: string;
    rating?: number;
    text?: { text?: string };
    originalText?: { text?: string };
    authorAttribution?: {
      displayName?: string;
      uri?: string;
      photoUri?: string;
    };
    publishTime?: string;
    googleMapsUri?: string;
  }>;
};

export type GooglePlacesReviews = {
  placeName: string;
  googleMapsUrl: string;
  rating: number;
  userRatingCount: number;
  reviews: GoogleReview[];
};

function safeHttpsUrl(value: string | undefined) {
  if (!value) return "";
  try {
    return new URL(value).protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

function safeRating(value: number | undefined) {
  return Number.isFinite(value) && value && value >= 1 && value <= 5
    ? Math.round(value)
    : 0;
}

export function mapGooglePlacesReviews(
  placeId: string,
  payload: GooglePlacesApiResponse,
): GooglePlacesReviews {
  const googleMapsUrl = safeHttpsUrl(payload.googleMapsUri);
  const reviews = (payload.reviews ?? [])
    .map((review, index): GoogleReview | null => {
      const rating = safeRating(review.rating);
      if (!rating) return null;
      const text =
        review.text?.text?.trim() ||
        review.originalText?.text?.trim() ||
        "Avaliação sem comentário.";
      const profileUrl = safeHttpsUrl(review.googleMapsUri) || googleMapsUrl;
      return {
        id: review.name || `${placeId}-${index}`,
        googleReviewId: review.name || `${placeId}-${index}`,
        name:
          review.authorAttribution?.displayName?.trim() || "Viajante Google",
        roleTitle: "Avaliação do Google",
        city: "Google Reviews",
        rating,
        text,
        imageUrl: safeHttpsUrl(review.authorAttribution?.photoUri),
        profileUrl,
        sourceUrl: profileUrl,
        source: "google_places",
        provider: "places",
        canModerate: false,
        featured: false,
        visible: true,
        orderIndex: index,
        createdAt: review.publishTime || "",
        syncedAt: "",
        expiresAt: "",
        replyComment: "",
        replyStatus: "none",
        replyError: "",
      };
    })
    .filter((review): review is GoogleReview => Boolean(review));

  return {
    placeName: payload.displayName?.text?.trim() || "Google Maps",
    googleMapsUrl,
    rating: safeRating(payload.rating),
    userRatingCount: Number.isFinite(payload.userRatingCount)
      ? Math.max(0, Math.floor(payload.userRatingCount ?? 0))
      : 0,
    reviews,
  };
}

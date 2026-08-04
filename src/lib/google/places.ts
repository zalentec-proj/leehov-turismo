import "server-only";

const GOOGLE_PLACES_API_KEY_ENV = "GOOGLE_PLACES_API_KEY";
const GOOGLE_PLACES_PLACE_ID_ENV = "GOOGLE_PLACES_PLACE_ID";

export type GooglePlacesConfiguration = {
  apiKey: string;
  placeId: string;
  configured: boolean;
};

export function getGooglePlacesConfiguration(): GooglePlacesConfiguration {
  const apiKey = process.env[GOOGLE_PLACES_API_KEY_ENV]?.trim() ?? "";
  const placeId = process.env[GOOGLE_PLACES_PLACE_ID_ENV]?.trim() ?? "";
  return {
    apiKey,
    placeId,
    configured: Boolean(apiKey && /^[A-Za-z0-9_-]{10,255}$/.test(placeId)),
  };
}

export function getGooglePlacesPublicConfiguration() {
  const { placeId, configured } = getGooglePlacesConfiguration();
  return { placeId, configured };
}

export function assertGooglePlacesConfiguration(): GooglePlacesConfiguration {
  const configuration = getGooglePlacesConfiguration();
  if (!configuration.configured) {
    throw new Error("A Places API ainda não está configurada no servidor.");
  }
  return configuration;
}

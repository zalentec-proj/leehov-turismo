export type AttributionInput = {
  pagePath?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

export function collectAttribution(): AttributionInput {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  return {
    pagePath: window.location.pathname,
    utmSource: params.get("utm_source") ?? "",
    utmMedium: params.get("utm_medium") ?? "",
    utmCampaign: params.get("utm_campaign") ?? "",
    utmContent: params.get("utm_content") ?? "",
    utmTerm: params.get("utm_term") ?? "",
  };
}

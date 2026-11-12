export type AttributionInput = {
  pagePath?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

const utmKeys = {
  utmSource: "utm_source",
  utmMedium: "utm_medium",
  utmCampaign: "utm_campaign",
  utmContent: "utm_content",
  utmTerm: "utm_term",
} as const;
type UtmFields = Record<keyof typeof utmKeys, string>;
const emptyUtms: UtmFields = { utmSource: "", utmMedium: "", utmCampaign: "", utmContent: "", utmTerm: "" };
let campaignUtms = emptyUtms;

// Preserve campaign context in this document, without rewriting URLs or cookies.
export function rememberCampaignUtms(params: URLSearchParams) {
  if (!Object.values(utmKeys).some((key) => params.has(key))) return;
  campaignUtms = {
    utmSource: params.get(utmKeys.utmSource) ?? "",
    utmMedium: params.get(utmKeys.utmMedium) ?? "",
    utmCampaign: params.get(utmKeys.utmCampaign) ?? "",
    utmContent: params.get(utmKeys.utmContent) ?? "",
    utmTerm: params.get(utmKeys.utmTerm) ?? "",
  };
}

export function collectAttribution(): AttributionInput {
  if (typeof window === "undefined") return {};

  rememberCampaignUtms(new URLSearchParams(window.location.search));
  return { pagePath: window.location.pathname, ...campaignUtms };
}

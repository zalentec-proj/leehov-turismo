import type { Tables } from "@/types/database";

export type CaravanStatus = Tables<"caravans">["status"];
export type DepartureStatus = Tables<"caravan_departures">["status"];

export type CaravanCategory = Pick<
  Tables<"caravan_categories">,
  "id" | "name" | "slug" | "description" | "active" | "sort_order"
>;

export type CaravanDeparture = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  availableSpots: number | null;
  status: DepartureStatus;
  notes: string;
  orderIndex: number;
};

export type CaravanItineraryDay = {
  id: string;
  day: number;
  title: string;
  location: string;
  description: string;
  imagePath: string;
  imageUrl: string;
  meals: string[];
  accommodation: string;
  notes: string;
  orderIndex: number;
};

export type CaravanImage = {
  id: string;
  imagePath: string;
  imageUrl: string;
  altText: string;
  caption: string;
  orderIndex: number;
};

export type CaravanSummary = {
  id: string;
  title: string;
  slug: string;
  destination: string;
  category: CaravanCategory | null;
  duration: string;
  departureLabel: string;
  nextDeparture: string | null;
  status: CaravanStatus;
  price?: string;
  summary: string;
  imagePath: string;
  imageUrl: string;
  featuredHero: boolean;
  featuredHome: boolean;
  heroOrder: number;
  published: boolean;
  publishedAt: string | null;
};

export type CaravanDetail = CaravanSummary & {
  type: string;
  description: string;
  currency: string;
  heroImagePath: string;
  heroImageUrl: string;
  videoUrl: string;
  videoThumbnailPath: string;
  videoThumbnailUrl: string;
  isGroupTrip: boolean;
  isAccompanied: boolean;
  hasPortugueseGuide: boolean;
  hasLeehovRepresentative: boolean;
  hasTravelKit: boolean;
  hasTravelInsurance: boolean;
  minPeople: number | null;
  maxPeople: number | null;
  leaderName: string;
  leaderBio: string;
  leaderImagePath: string;
  leaderImageUrl: string;
  included: string[];
  notIncluded: string[];
  notes: string;
  heroTitle: string;
  heroDescription: string;
  heroCtaText: string;
  heroCtaUrl: string;
  seoTitle: string;
  seoDescription: string;
  departures: CaravanDeparture[];
  itinerary: CaravanItineraryDay[];
  images: CaravanImage[];
  createdAt: string;
  updatedAt: string;
};

export type AdminCaravan = CaravanDetail;

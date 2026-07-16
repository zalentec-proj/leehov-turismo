export type CaravanStatus =
  | "available"
  | "coming_soon"
  | "waitlist"
  | "sold_out"
  | "draft";

export type CaravanSummary = {
  id: string;
  title: string;
  slug: string;
  destination: string;
  duration: string;
  departureLabel: string;
  status: CaravanStatus;
  price?: string;
  summary: string;
  imageUrl: string;
  featuredHero: boolean;
  featuredHome: boolean;
};

export type CaravanDetail = CaravanSummary & {
  description: string;
  included: string[];
  notIncluded: string[];
  itinerary: Array<{
    day: number;
    title: string;
    location: string;
    description: string;
  }>;
};

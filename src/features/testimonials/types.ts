export type TestimonialSource = "manual" | "google";

export type TestimonialSummary = {
  id: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  source: TestimonialSource;
};

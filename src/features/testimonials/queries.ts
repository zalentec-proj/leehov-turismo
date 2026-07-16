import { demoTestimonials } from "@/data/demo-content";
import type { TestimonialSummary } from "@/features/testimonials/types";

export async function getFeaturedTestimonials(): Promise<TestimonialSummary[]> {
  return demoTestimonials;
}

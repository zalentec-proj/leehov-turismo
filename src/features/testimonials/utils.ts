export function clampRating(rating: number) {
  return Math.min(5, Math.max(1, Math.round(rating)));
}

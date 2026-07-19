import type { BlogPostFormInput } from "@/features/blog/schema";

export const BLOG_GALLERY_ORDER_STEP = 10;
export const BLOG_GALLERY_SWIPE_THRESHOLD = 52;

export function normalizeBlogGalleryOrder(images: BlogPostFormInput["images"]): BlogPostFormInput["images"] {
  return images.map((image, index) => ({
    ...image,
    orderIndex: index * BLOG_GALLERY_ORDER_STEP,
  }));
}

export function getBlogGallerySwipeTarget(startX: number, endX: number, currentIndex: number, total: number) {
  const distance = endX - startX;
  if (distance > BLOG_GALLERY_SWIPE_THRESHOLD) return Math.max(0, currentIndex - 1);
  if (distance < -BLOG_GALLERY_SWIPE_THRESHOLD) return Math.min(total - 1, currentIndex + 1);
  return currentIndex;
}

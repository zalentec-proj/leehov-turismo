export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type BlogPostImage = {
  id: string;
  imagePath: string;
  imageUrl: string;
  altText: string;
  caption: string;
  orderIndex: number;
};

export type BlogPostSummary = {
  id: string;
  title: string;
  slug: string;
  category: string;
  categoryId: string;
  categorySlug: string;
  summary: string;
  readingTime: number;
  imagePath: string;
  imageUrl: string;
  coverAltText: string;
  author: string;
  publishedAt: string;
  relatedDestination: string;
  featuredHome: boolean;
  featuredBlog: boolean;
};

export type BlogPostDetail = BlogPostSummary & {
  content: string;
  seoTitle: string;
  seoDescription: string;
  images: BlogPostImage[];
  relatedCaravan: { id: string; title: string; slug: string; published: boolean } | null;
};

export type AdminBlogPost = BlogPostDetail & {
  published: boolean;
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostFormValues = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImagePath: string;
  coverAltText: string;
  categoryId: string;
  relatedCaravanId: string;
  relatedDestination: string;
  author: string;
  publishedAt: string;
  featuredHome: boolean;
  featuredBlog: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  images: Array<{
    id: string;
    imagePath: string;
    altText: string;
    caption: string;
    orderIndex: number;
  }>;
};

export type BlogActionResult = {
  success: boolean;
  message: string;
  id?: string;
  path?: string;
  url?: string;
};

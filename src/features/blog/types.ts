export type BlogPostSummary = {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  readingTime: number;
  imageUrl: string;
};

export type BlogPostDetail = BlogPostSummary & {
  content: string;
  publishedAt: string;
  author: string;
};

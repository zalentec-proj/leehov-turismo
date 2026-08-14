export const mediaFolders = ["general", "packages", "blog", "testimonials", "popups", "seo", "home"] as const;

export type MediaFolder = (typeof mediaFolders)[number];

export type MediaUsage = {
  id: string;
  label: string;
  type: "package" | "blog_post" | "testimonial" | "popup" | "setting";
};

export type MediaAsset = {
  id: string;
  storageBucket: "site-media" | "caravan-images" | "blog-images";
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  altText: string;
  caption: string;
  folder: string;
  sourceType: string;
  sourceId: string;
  sourceLabel: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  signedUrl: string;
  usage: MediaUsage[];
};

export type MediaActionResult = {
  success: boolean;
  message: string;
  asset?: MediaAsset;
};

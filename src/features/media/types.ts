export const mediaFolders = ["general", "testimonials", "popups", "seo", "home"] as const;

export type MediaFolder = (typeof mediaFolders)[number];

export type MediaUsage = {
  id: string;
  label: string;
  type: "testimonial" | "popup" | "setting";
};

export type MediaAsset = {
  id: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  altText: string;
  caption: string;
  folder: string;
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

import type { Enums } from "@/types/database";

export type PopupType = Enums<"popup_type">;
export type PopupFrequency = Enums<"popup_frequency">;
export type PopupDisplayLocation = Enums<"popup_display_location">;

export type Popup = {
  id: string;
  title: string;
  description: string;
  imageAssetId: string;
  imageUrl: string;
  imageAlt: string;
  buttonText: string;
  buttonUrl: string;
  popupType: PopupType;
  relatedCaravanId: string;
  relatedCaravanTitle: string;
  relatedCaravanSlug: string;
  displayLocation: PopupDisplayLocation;
  frequency: PopupFrequency;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PopupActionResult = { success: boolean; message: string; id?: string };

import type { Tables } from "@/types/database";

export type AdminProfile = Pick<
  Tables<"profiles">,
  "id" | "name" | "email" | "role" | "active"
>;

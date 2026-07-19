export type DashboardTrend = {
  current: number;
  previous: number;
  percentage: number | null;
};

export type DashboardMetric = {
  id: "caravans" | "posts" | "leads" | "newsletter";
  label: string;
  value: number;
  trend: DashboardTrend;
};

export type DashboardTimelinePoint = {
  date: string;
  label: string;
  value: number;
};

export type DashboardRecentLead = {
  id: string;
  name: string;
  email: string;
  source: "contact" | "caravan_interest" | "popup" | string;
  status: "new" | "in_progress" | "converted" | "archived" | string;
  createdAt: string;
};

export type DashboardContentItem = {
  id: string;
  title: string;
  description: string;
  published: boolean;
  updatedAt: string;
};

export type DashboardActivity = {
  id: string;
  kind: "caravan" | "post" | "lead" | "newsletter";
  description: string;
  occurredAt: string;
};

export type AdminDashboardData = {
  generatedAt: string;
  metrics: DashboardMetric[];
  timeline: DashboardTimelinePoint[];
  recentLeads: DashboardRecentLead[];
  recentCaravans: DashboardContentItem[];
  recentPosts: DashboardContentItem[];
  activities: DashboardActivity[];
};

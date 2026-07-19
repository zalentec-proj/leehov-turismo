import "server-only";

import { requireActiveProfile } from "@/features/auth/queries";
import type {
  AdminDashboardData,
  DashboardActivity,
  DashboardContentItem,
  DashboardMetric,
  DashboardRecentLead,
} from "@/features/dashboard/types";
import { buildDailyTimeline, calculateTrend } from "@/features/dashboard/utils";
import { createClient } from "@/lib/supabase/server";

type CaravanRow = {
  id: string;
  title: string;
  destination: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

type PostRow = {
  id: string;
  title: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

type LeadRow = {
  id: string;
  name: string;
  email: string;
  source: string;
  status: string;
  created_at: string;
};

type SubscriberRow = {
  id: string;
  status: string;
  active: boolean | null;
  created_at: string;
  confirmed_at: string | null;
};

function newestFirst<T extends { updated_at?: string; created_at: string }>(items: T[]) {
  return [...items].sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime());
}

function contentItem(row: CaravanRow | PostRow, description: string): DashboardContentItem {
  return {
    id: row.id,
    title: row.title,
    description,
    published: row.published,
    updatedAt: row.updated_at,
  };
}

function makeActivities(caravans: CaravanRow[], posts: PostRow[], leads: LeadRow[], subscribers: SubscriberRow[]): DashboardActivity[] {
  const activities: DashboardActivity[] = [
    ...caravans.map((caravan) => ({
      id: `caravan-${caravan.id}`,
      kind: "caravan" as const,
      description: caravan.published
        ? `Caravana “${caravan.title}” atualizada`
        : `Rascunho da caravana “${caravan.title}” atualizado`,
      occurredAt: caravan.updated_at,
    })),
    ...posts.map((post) => ({
      id: `post-${post.id}`,
      kind: "post" as const,
      description: post.published
        ? `Post “${post.title}” atualizado`
        : `Rascunho do post “${post.title}” atualizado`,
      occurredAt: post.updated_at,
    })),
    ...leads.map((lead) => ({
      id: `lead-${lead.id}`,
      kind: "lead" as const,
      description: `Novo lead de ${lead.name} recebido`,
      occurredAt: lead.created_at,
    })),
    ...subscribers.map((subscriber) => ({
      id: `newsletter-${subscriber.id}`,
      kind: "newsletter" as const,
      description: subscriber.status === "active" ? "Novo inscrito confirmou a newsletter" : "Novo cadastro na newsletter recebido",
      occurredAt: subscriber.confirmed_at ?? subscriber.created_at,
    })),
  ];

  return activities
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 5);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await requireActiveProfile();
  const supabase = await createClient();
  const [caravansResult, postsResult, leadsResult, subscribersResult] = await Promise.all([
    supabase.from("caravans").select("id, title, destination, published, created_at, updated_at, published_at"),
    supabase.from("blog_posts").select("id, title, published, created_at, updated_at, published_at"),
    supabase.from("leads").select("id, name, email, source, status, created_at").order("created_at", { ascending: false }),
    supabase.from("newsletter_subscribers").select("id, status, active, created_at, confirmed_at"),
  ]);

  for (const result of [caravansResult, postsResult, leadsResult, subscribersResult]) {
    if (result.error) throw new Error(`Não foi possível carregar a visão geral: ${result.error.message}`);
  }

  const caravans = (caravansResult.data ?? []) as CaravanRow[];
  const posts = (postsResult.data ?? []) as PostRow[];
  const leads = (leadsResult.data ?? []) as LeadRow[];
  const subscribers = (subscribersResult.data ?? []) as SubscriberRow[];
  const activeCaravans = caravans.filter((item) => item.published);
  const publishedPosts = posts.filter((item) => item.published);
  const activeSubscribers = subscribers.filter((item) => item.active || item.status === "active");
  const now = new Date();

  const metrics: DashboardMetric[] = [
    {
      id: "caravans",
      label: "Caravanas ativas",
      value: activeCaravans.length,
      trend: calculateTrend(activeCaravans.map((item) => item.published_at), now),
    },
    {
      id: "posts",
      label: "Posts publicados",
      value: publishedPosts.length,
      trend: calculateTrend(publishedPosts.map((item) => item.published_at), now),
    },
    {
      id: "leads",
      label: "Leads recebidos",
      value: leads.length,
      trend: calculateTrend(leads.map((item) => item.created_at), now),
    },
    {
      id: "newsletter",
      label: "Inscritos newsletter",
      value: activeSubscribers.length,
      trend: calculateTrend(activeSubscribers.map((item) => item.confirmed_at), now),
    },
  ];

  const recentLeads: DashboardRecentLead[] = leads.slice(0, 5).map((lead) => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    source: lead.source,
    status: lead.status,
    createdAt: lead.created_at,
  }));

  return {
    generatedAt: now.toISOString(),
    metrics,
    timeline: buildDailyTimeline(leads.map((item) => item.created_at), now),
    recentLeads,
    recentCaravans: newestFirst(caravans).slice(0, 3).map((item) => contentItem(item, item.destination)),
    recentPosts: newestFirst(posts).slice(0, 3).map((item) => contentItem(item, item.published ? "Publicado" : "Rascunho")),
    activities: makeActivities(caravans, posts, leads, subscribers),
  };
}

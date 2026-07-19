import { MessageSquareQuote, Star, ThumbsUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireActiveProfile } from "@/features/auth/queries";
import { getMediaAssetOptions } from "@/features/media/queries";
import { AdminTestimonials } from "@/features/testimonials/components/admin-testimonials";
import { getAdminGoogleReviews, getAdminTestimonials, getGoogleBusinessSettings, getTestimonialMetrics } from "@/features/testimonials/queries";

export default async function AdminTestimonialsPage() {
  const profile = await requireActiveProfile();
  const [testimonials, reviews, settings, metrics, media] = await Promise.all([getAdminTestimonials(), getAdminGoogleReviews(), getGoogleBusinessSettings(true), getTestimonialMetrics(), getMediaAssetOptions()]);
  const cards = [{ label: "Depoimentos", value: metrics.total, icon: MessageSquareQuote }, { label: "Ativos", value: metrics.active, icon: Users }, { label: "Destaques", value: metrics.featured, icon: Star }, { label: "Google visíveis", value: metrics.googleVisible, icon: ThumbsUp }];
  const safeSettings = profile.role === "admin" ? settings : { ...settings, accountId: "", locationId: "", connection: null };
  return <><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-leehov-blue-600">Reputação</p><h2 className="mt-3 text-3xl font-extrabold text-leehov-navy-950">Depoimentos</h2><p className="mt-3 text-leehov-muted">Conteúdo manual publicado na Home e preparação segura para Google Reviews.</p></div><div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((item) => <Card key={item.label} className="rounded-[18px] border-leehov-border p-5 shadow-leehov-card"><item.icon className="size-6 text-leehov-blue-500" /><p className="mt-5 text-3xl font-extrabold text-leehov-navy-950">{item.value}</p><p className="mt-1 text-sm text-leehov-muted">{item.label}</p></Card>)}</div><AdminTestimonials testimonials={testimonials} reviews={reviews} settings={safeSettings} media={media} isAdmin={profile.role === "admin"} /></>;
}

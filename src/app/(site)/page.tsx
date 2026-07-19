import { HomePage } from "@/components/leehov/site/home-page";
import { getFeaturedCaravans, getHeroCaravans } from "@/features/caravans/queries";
import { getFeaturedPosts } from "@/features/blog/queries";
import { getFeaturedTestimonials } from "@/features/testimonials/queries";
import { getPublicSiteSettings } from "@/features/settings/queries";

export default async function Page() {
  const [caravans, heroCaravans, posts, testimonials, settings] = await Promise.all([
    getFeaturedCaravans(),
    getHeroCaravans(),
    getFeaturedPosts(),
    getFeaturedTestimonials(),
    getPublicSiteSettings(),
  ]);

  return (
    <HomePage caravans={caravans} heroCaravans={heroCaravans} posts={posts} testimonials={testimonials} homeSettings={settings.home} />
  );
}

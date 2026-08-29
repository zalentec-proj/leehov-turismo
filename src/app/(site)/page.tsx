import { HomePage } from "@/components/leehov/site/home-page";
import { getFeaturedCaravans, getHeroCaravans } from "@/features/caravans/queries";
import { getFeaturedPosts } from "@/features/blog/queries";
import { getPublicSiteSettings } from "@/features/settings/queries";

export default async function Page() {
  const [caravans, heroCaravans, posts, settings] = await Promise.all([
    getFeaturedCaravans(),
    getHeroCaravans(),
    getFeaturedPosts(),
    getPublicSiteSettings(),
  ]);

  return (
    <HomePage caravans={caravans} heroCaravans={heroCaravans} posts={posts} homeSettings={settings.home} />
  );
}

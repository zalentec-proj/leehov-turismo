import { HomePage } from "@/components/leehov/site/home-page";
import { getFeaturedCaravans } from "@/features/caravans/queries";
import { getFeaturedPosts } from "@/features/blog/queries";
import { getFeaturedTestimonials } from "@/features/testimonials/queries";

export default async function Page() {
  const [caravans, posts, testimonials] = await Promise.all([
    getFeaturedCaravans(),
    getFeaturedPosts(),
    getFeaturedTestimonials(),
  ]);

  return (
    <HomePage caravans={caravans} posts={posts} testimonials={testimonials} />
  );
}

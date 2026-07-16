import { AdminPlaceholderPage } from "@/components/leehov/admin/admin-placeholder-page";

export default function AdminTestimonialsPage() {
  return (
    <AdminPlaceholderPage
      title="Depoimentos"
      description="Depoimentos manuais e Google Reviews cacheados, com controle de visibilidade e destaque."
      items={["CRUD manual", "Reviews Google", "Destaques", "Resposta via servidor"]}
    />
  );
}

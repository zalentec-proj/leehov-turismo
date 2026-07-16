import { SectionHeading } from "@/components/leehov/shared/section-heading";

export const metadata = {
  title: "Quem Somos",
};

export default function AboutPage() {
  return (
    <section className="bg-leehov-surface px-5 pb-24 pt-40 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <SectionHeading
          eyebrow="Sobre a Leehov"
          title="Viagens em grupo com cuidado, clareza e acompanhamento."
          description="Pagina estrutural pronta para receber historia, fotos reais, equipe e diferenciais aprovados pela Leehov."
        />
        <div className="min-h-[460px] rounded-[32px] bg-cover bg-center shadow-leehov-floating" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80)" }} />
      </div>
    </section>
  );
}

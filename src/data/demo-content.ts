import type { BlogPostSummary } from "@/features/blog/types";
import type { CaravanSummary } from "@/features/caravans/types";
import type { TestimonialSummary } from "@/features/testimonials/types";

export const demoCaravans: CaravanSummary[] = [
  {
    id: "italia-cultural",
    title: "Italia Cultural",
    slug: "italia-cultural",
    destination: "Roma, Assis e Toscana",
    duration: "10 dias",
    departureLabel: "Saida em setembro",
    status: "coming_soon",
    price: "Em breve",
    summary:
      "Historia, gastronomia e espiritualidade em um roteiro pensado para viajar em grupo.",
    imageUrl:
      "https://app.paper.design/file-assets/01KW53FCR6TMPD7ZTD8XRG1SKZ/01KW5C1A7VTT5C5FVFV9GZVKND.jpg",
    featuredHero: true,
    featuredHome: true,
  },
  {
    id: "terra-santa",
    title: "Terra Santa Completa",
    slug: "terra-santa-completa",
    destination: "Israel e Jordania",
    duration: "12 dias",
    departureLabel: "Saidas em abril e outubro",
    status: "available",
    price: "Consulte valores",
    summary:
      "Uma caravana de fe, cultura e historia com acompanhamento proximo do inicio ao fim.",
    imageUrl:
      "https://app.paper.design/file-assets/01KW53FCR6TMPD7ZTD8XRG1SKZ/0E8PM2ZTHHEJNGCZE08X1EK343.jpg",
    featuredHero: false,
    featuredHome: true,
  },
  {
    id: "japao-cultural",
    title: "Japao Cultural",
    slug: "japao-cultural",
    destination: "Toquio, Kyoto e Osaka",
    duration: "14 dias",
    departureLabel: "Lista de interesse aberta",
    status: "waitlist",
    price: "Sob consulta",
    summary:
      "Um roteiro acompanhado para conhecer templos, jardins, tecnologia e tradicoes japonesas.",
    imageUrl:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80",
    featuredHero: false,
    featuredHome: true,
  },
];

export const demoPosts: BlogPostSummary[] = [
  {
    id: "documentos-viagem",
    title: "Documentos essenciais para viajar em grupo",
    slug: "documentos-essenciais-para-viajar-em-grupo",
    category: "Dica de viagem",
    summary:
      "Um guia objetivo para organizar passaporte, seguros e comprovantes antes do embarque.",
    readingTime: 6,
    imageUrl:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "terra-santa-fe",
    title: "Terra Santa: uma viagem de fe e memoria",
    slug: "terra-santa-uma-viagem-de-fe-e-memoria",
    category: "Roteiros",
    summary:
      "Como uma caravana acompanhada ajuda a viver cada local com contexto e seguranca.",
    readingTime: 8,
    imageUrl:
      "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "viajar-sozinho-grupo",
    title: "Posso viajar sozinho em uma caravana?",
    slug: "posso-viajar-sozinho-em-uma-caravana",
    category: "Viagens em grupo",
    summary:
      "Entenda como a dinamica do grupo acolhe quem quer viajar sem montar tudo por conta propria.",
    readingTime: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  },
];

export const demoTestimonials: TestimonialSummary[] = [
  {
    id: "maria",
    name: "Maria Fernanda",
    city: "Sao Paulo, SP",
    rating: 5,
    text: "A Leehov cuidou de cada detalhe e nos sentimos acompanhados durante toda a viagem.",
    source: "manual",
  },
  {
    id: "joao",
    name: "Joao Paulo",
    city: "Curitiba, PR",
    rating: 5,
    text: "O roteiro foi organizado, seguro e com uma equipe sempre presente para orientar o grupo.",
    source: "google",
  },
  {
    id: "carla",
    name: "Carla Andrade",
    city: "Belo Horizonte, MG",
    rating: 5,
    text: "Foi a primeira viagem em grupo da minha familia e a experiencia superou as expectativas.",
    source: "manual",
  },
];

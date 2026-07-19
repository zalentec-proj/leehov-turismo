import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CaravanItineraryCarousel } from "@/features/caravans/components/caravan-itinerary-carousel";
import type { CaravanItineraryDay } from "@/features/caravans/types";

const days: CaravanItineraryDay[] = [
  { id: "day-1", day: 1, title: "Chegada em Bangkok", location: "Tailândia", description: "Recepção e encontro com o grupo.", imagePath: "one.jpg", imageUrl: "https://example.com/one.jpg", meals: [], accommodation: "", notes: "", orderIndex: 0 },
  { id: "day-2", day: 2, title: "Templos de Bangkok", location: "Tailândia", description: "Um dia entre templos e mercados.", imagePath: "two.jpg", imageUrl: "https://example.com/two.jpg", meals: ["Café da manhã"], accommodation: "Bangkok", notes: "", orderIndex: 10 },
  { id: "day-3", day: 3, title: "Próxima parada", location: "Camboja", description: "Continuação da jornada.", imagePath: "", imageUrl: "", meals: [], accommodation: "", notes: "", orderIndex: 20 },
];

describe("CaravanItineraryCarousel", () => {
  it("navega por botões e teclado sem ultrapassar as extremidades", async () => {
    const user = userEvent.setup();
    render(<CaravanItineraryCarousel days={days} />);

    expect(screen.getByRole("heading", { name: "Chegada em Bangkok" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dia anterior" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Próximo dia" }));
    expect(screen.getByRole("heading", { name: "Templos de Bangkok" })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("tabpanel"), { key: "End" });
    expect(screen.getByRole("heading", { name: "Próxima parada" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próximo dia" })).toBeDisabled();
  });

  it("permite selecionar um dia pela linha do tempo", async () => {
    const user = userEvent.setup();
    render(<CaravanItineraryCarousel days={days} />);
    await user.click(screen.getByRole("tab", { name: "Dia 02" }));
    expect(screen.getByRole("heading", { name: "Templos de Bangkok" })).toBeInTheDocument();
    expect(screen.getByText("Café da manhã")).toBeInTheDocument();
  });

  it("mantém estado vazio seguro", () => {
    render(<CaravanItineraryCarousel days={[]} />);
    expect(screen.getByText(/roteiro detalhado será divulgado/i)).toBeInTheDocument();
  });
});

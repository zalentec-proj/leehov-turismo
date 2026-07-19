import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BlogPhotoGallery } from "@/features/blog/components/blog-photo-gallery";
import type { BlogPostImage } from "@/features/blog/types";

function makeImages(count: number): BlogPostImage[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `image-${index + 1}`,
    imagePath: `post/gallery/image-${index + 1}.jpg`,
    imageUrl: `https://example.com/image-${index + 1}.jpg`,
    altText: `Descrição da foto ${index + 1}`,
    caption: `Legenda da foto ${index + 1}`,
    orderIndex: index * 10,
  }));
}

describe("BlogPhotoGallery", () => {
  it.each([0, 1, 2, 4, 8, 9])("renderiza o estado com %i imagens", (count) => {
    const { container } = render(<BlogPhotoGallery images={makeImages(count)} />);
    if (count === 0) {
      expect(container).toBeEmptyDOMElement();
      return;
    }
    expect(screen.getByRole("button", { name: /Ampliar foto 1:/ })).toBeInTheDocument();
    expect(screen.getByText(`1 / ${count}`)).toBeInTheDocument();
    if (count > 3) expect(screen.getByRole("button", { name: `Ver todas as ${count} fotos` })).toBeInTheDocument();
  });

  it("abre no índice clicado e mantém limites de navegação", async () => {
    const user = userEvent.setup();
    render(<BlogPhotoGallery images={makeImages(4)} />);

    await user.click(screen.getByRole("button", { name: "Abrir foto 2 em tela cheia" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText("2 de 4").length).toBeGreaterThan(0);

    await user.keyboard("{End}");
    expect(screen.getAllByText("4 de 4").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Próxima foto" })).toBeDisabled();

    await user.keyboard("{Home}");
    expect(screen.getAllByText("1 de 4").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Foto anterior" })).toBeDisabled();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("exibe fallback quando uma imagem falha", async () => {
    const user = userEvent.setup();
    render(<BlogPhotoGallery images={makeImages(1)} />);
    await user.click(screen.getByRole("button", { name: /Ampliar foto 1:/ }));
    fireEvent.error(within(screen.getByRole("dialog")).getByAltText("Descrição da foto 1"));
    expect(screen.getByText("Imagem indisponível")).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminBlogTable } from "@/features/blog/components/admin-blog-table";
import type { AdminBlogListItem } from "@/features/blog/types";

const actions = vi.hoisted(() => ({
  publish: vi.fn(),
  deleteDraft: vi.fn(),
}));

vi.mock("@/features/blog/actions", () => ({
  setBlogPostPublishedAction: actions.publish,
  deleteDraftBlogPostAction: actions.deleteDraft,
}));

function makePosts(count: number): AdminBlogListItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `post-${index + 1}`,
    title: `Artigo ${index + 1}`,
    slug: `artigo-${index + 1}`,
    summary: `Resumo editorial do artigo ${index + 1}`,
    category: "Destinos",
    categoryId: "destinos",
    author: "Equipe Leehov",
    readingTime: 4,
    imageUrl: "",
    published: false,
    featuredHome: false,
    featuredBlog: false,
    updatedAt: "2026-08-10T12:00:00.000Z",
  }));
}

function renderTable(posts = makePosts(9)) {
  return render(
    <AdminBlogTable
      data={posts}
      categories={[]}
      canCreate
      canUpdate
      canPublish
      canDeleteDraft
    />,
  );
}

describe("AdminBlogTable", () => {
  beforeEach(() => {
    actions.publish.mockReset();
    actions.deleteDraft.mockReset();
  });

  it("troca de página sem deixar o carregamento preso", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "Próxima" }));

    expect(screen.getByText("9 posts · página 2 de 2")).toBeInTheDocument();
    expect(screen.getByText("Artigo 9")).toBeInTheDocument();
    expect(screen.queryByText("Artigo 1")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeEnabled();
  });

  it("exibe o card até a publicação terminar e atualiza a linha sem recarregar", async () => {
    const user = userEvent.setup();
    let finish: ((result: { success: boolean; message: string }) => void) | undefined;
    actions.publish.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    renderTable(makePosts(1));

    await user.click(screen.getByRole("button", { name: "Publicar" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Publicando artigo...");

    finish?.({ success: true, message: "Post publicado." });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Publicado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Despublicar" })).toBeEnabled();
  });
});

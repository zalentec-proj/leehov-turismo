import { describe, expect, it } from "vitest";
import { getCaravanBackgroundMedia, getVimeoVideoId, getYouTubeVideoId } from "@/features/caravans/media";

describe("mídia de fundo das caravanas", () => {
  it.each([
    ["https://www.youtube.com/watch?v=s072eABHb7s", "s072eABHb7s"],
    ["https://youtu.be/s072eABHb7s", "s072eABHb7s"],
    ["https://www.youtube.com/embed/s072eABHb7s", "s072eABHb7s"],
    ["https://www.youtube.com/shorts/s072eABHb7s", "s072eABHb7s"],
  ])("extrai o id do YouTube em %s", (url, expected) => {
    expect(getYouTubeVideoId(url)).toBe(expected);
  });

  it("gera um embed silencioso, contínuo e sem cookies para YouTube", () => {
    const media = getCaravanBackgroundMedia("https://www.youtube.com/watch?v=s072eABHb7s");
    expect(media?.kind).toBe("youtube");
    expect(media?.src).toContain("youtube-nocookie.com/embed/s072eABHb7s");
    expect(media?.src).toContain("mute=1");
    expect(media?.src).toContain("loop=1");
  });

  it("reconhece Vimeo e arquivos HTTPS", () => {
    expect(getVimeoVideoId("https://vimeo.com/123456789")).toBe("123456789");
    expect(getCaravanBackgroundMedia("https://cdn.example.com/hero.webm")).toEqual({ kind: "video", src: "https://cdn.example.com/hero.webm" });
  });

  it("rejeita protocolos inseguros", () => {
    expect(getCaravanBackgroundMedia("http://example.com/video.mp4")).toBeNull();
    expect(getCaravanBackgroundMedia("javascript:alert(1)")).toBeNull();
  });
});

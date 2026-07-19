export type CaravanBackgroundMedia =
  | { kind: "youtube"; src: string }
  | { kind: "vimeo"; src: string }
  | { kind: "video"; src: string }
  | null;

function safeUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function getYouTubeVideoId(value: string): string {
  const url = safeUrl(value);
  if (!url) return "";
  const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

  if (hostname === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? "";
  if (!hostname.endsWith("youtube.com")) return "";
  if (url.searchParams.get("v")) return url.searchParams.get("v") ?? "";

  const [prefix, id] = url.pathname.split("/").filter(Boolean);
  return ["embed", "shorts", "live"].includes(prefix) ? (id ?? "") : "";
}

export function getVimeoVideoId(value: string): string {
  const url = safeUrl(value);
  if (!url || !url.hostname.replace(/^www\./, "").toLowerCase().endsWith("vimeo.com")) return "";
  return url.pathname.split("/").filter(Boolean).findLast((segment) => /^\d+$/.test(segment)) ?? "";
}

export function getCaravanBackgroundMedia(value: string): CaravanBackgroundMedia {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const youtubeId = getYouTubeVideoId(trimmed);
  if (youtubeId) {
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      controls: "0",
      loop: "1",
      playlist: youtubeId,
      playsinline: "1",
      rel: "0",
      modestbranding: "1",
    });
    return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${youtubeId}?${params}` };
  }

  const vimeoId = getVimeoVideoId(trimmed);
  if (vimeoId) {
    return { kind: "vimeo", src: `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&muted=1&loop=1&autopause=0` };
  }

  if (trimmed.startsWith("/") || /^https:\/\//i.test(trimmed)) return { kind: "video", src: trimmed };
  return null;
}

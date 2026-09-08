const translationMarkers = [
  "(Translated by Google)",
  "(Traduzido pelo Google)",
];
const originalMarkers = ["(Original)", "(Texto original)"];

export function normalizeGoogleReviewText(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "Avaliação sem comentário.";

  const translationIndex = translationMarkers.reduce((closest, marker) => {
    const index = text.indexOf(marker);
    if (index < 0) return closest;
    return closest < 0 ? index : Math.min(closest, index);
  }, -1);

  if (translationIndex > 0) return text.slice(0, translationIndex).trim();
  if (translationIndex === 0) {
    for (const marker of originalMarkers) {
      const index = text.indexOf(marker);
      if (index >= 0) return text.slice(index + marker.length).trim();
    }
  }

  return text;
}

import { describe, expect, it } from "vitest";
import { buildDailyTimeline, calculateTrend, formatDashboardTrend } from "@/features/dashboard/utils";

const NOW = new Date("2026-07-19T12:00:00.000Z");

describe("dashboard metrics", () => {
  it("calcula comparação entre períodos de 30 dias", () => {
    const trend = calculateTrend([
      "2026-07-18T12:00:00.000Z",
      "2026-07-10T12:00:00.000Z",
      "2026-06-18T12:00:00.000Z",
    ], NOW);

    expect(trend).toEqual({ current: 2, previous: 1, percentage: 100 });
  });

  it("não inventa percentual quando não há base anterior", () => {
    const trend = calculateTrend(["2026-07-18T12:00:00.000Z"], NOW);
    expect(formatDashboardTrend(trend)).toEqual({ label: "1 no período", tone: "positive" });
  });

  it("monta uma série diária contínua para o gráfico", () => {
    const timeline = buildDailyTimeline(["2026-07-18T12:00:00.000Z", "2026-07-18T16:00:00.000Z"], NOW, 3);
    expect(timeline).toHaveLength(3);
    expect(timeline.map((point) => point.value)).toEqual([0, 2, 0]);
  });
});

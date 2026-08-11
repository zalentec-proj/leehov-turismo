import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  createDeliveries: vi.fn(),
  deliver: vi.fn(),
}));

vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/webhooks/delivery", () => ({
  createWebhookDeliveries: mocks.createDeliveries,
  deliverWebhookLog: mocks.deliver,
}));

import { emitWebhookEvent } from "@/lib/webhooks/events";

describe("emitWebhookEvent", () => {
  beforeEach(() => {
    mocks.after.mockReset();
    mocks.createDeliveries.mockReset();
    mocks.deliver.mockReset();
  });

  it("agenda persistência e entrega sem bloquear a ação principal", async () => {
    let scheduled: (() => Promise<void>) | undefined;
    mocks.after.mockImplementation((callback: () => Promise<void>) => { scheduled = callback; });
    mocks.createDeliveries.mockResolvedValue(["delivery-1"]);
    mocks.deliver.mockResolvedValue(undefined);

    await emitWebhookEvent("blog_post.published", { postId: "post-1" });

    expect(mocks.after).toHaveBeenCalledTimes(1);
    expect(mocks.createDeliveries).not.toHaveBeenCalled();

    await scheduled?.();

    expect(mocks.createDeliveries).toHaveBeenCalledWith("blog_post.published", { postId: "post-1" });
    expect(mocks.deliver).toHaveBeenCalledWith("delivery-1");
  });
});

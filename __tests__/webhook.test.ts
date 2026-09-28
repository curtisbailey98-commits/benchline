import { describe, expect, it } from "vitest";
import { createMemoryEventStore, shouldProcessEvent } from "@/lib/webhook";

describe("shouldProcessEvent", () => {
  it("processes a new event once", async () => {
    const store = createMemoryEventStore();
    expect(await shouldProcessEvent("evt_1", store)).toBe(true);
    expect(await shouldProcessEvent("evt_1", store)).toBe(false);
    expect(store.ids.has("evt_1")).toBe(true);
  });

  it("rejects empty ids", async () => {
    const store = createMemoryEventStore();
    expect(await shouldProcessEvent("", store)).toBe(false);
  });

  it("allows distinct events", async () => {
    const store = createMemoryEventStore();
    expect(await shouldProcessEvent("evt_a", store)).toBe(true);
    expect(await shouldProcessEvent("evt_b", store)).toBe(true);
    expect(store.ids.size).toBe(2);
  });
});

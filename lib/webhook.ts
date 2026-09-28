/**
 * Idempotency helper for Stripe webhook processing.
 * Callers should persist processed event IDs; this module
 * decides whether an event should be processed.
 */

export type ProcessedEventStore = {
  has: (eventId: string) => boolean | Promise<boolean>;
  add: (eventId: string) => void | Promise<void>;
};

export async function shouldProcessEvent(
  eventId: string,
  store: ProcessedEventStore
): Promise<boolean> {
  if (!eventId || typeof eventId !== "string") {
    return false;
  }
  const already = await store.has(eventId);
  if (already) return false;
  await store.add(eventId);
  return true;
}

/** In-memory store for tests */
export function createMemoryEventStore(): ProcessedEventStore & { ids: Set<string> } {
  const ids = new Set<string>();
  return {
    ids,
    has: (id) => ids.has(id),
    add: (id) => {
      ids.add(id);
    },
  };
}

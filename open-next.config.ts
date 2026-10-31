import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";

// Free-plan friendly: KV (no R2/card needed) for "use cache" + ISR data,
// a Durable Object queue for time-based revalidation, and a sharded
// Durable Object tag cache so /api/revalidate (revalidateTag) works.
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  queue: doQueue,
  tagCache: doShardedTagCache({ baseShardSize: 4 }),
});

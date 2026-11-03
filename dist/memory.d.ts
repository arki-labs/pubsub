import type { PubSub } from './types.js';
/**
 * A pubsub inside this process. Each call makes its own, separate bus.
 * Messages arrive on a later microtask, never inside `publish`, in the order they were published.
 */
export declare function memoryPubSub(): PubSub;
//# sourceMappingURL=memory.d.ts.map
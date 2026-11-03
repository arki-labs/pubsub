/**
 * `@arki/pubsub/redis`: Redis `PUBLISH`, and `SUBSCRIBE` on a second connection
 * (`client.duplicate()`), since a subscribed Redis connection can run nothing
 * else. It has no `publishIn`: Redis cannot join a database transaction.
 */
import type { Redis } from 'ioredis';
import type { PubSub } from '../types.js';
export type RedisPubSubOptions = {
    /** An ioredis client. It publishes; a duplicate of it subscribes. `close()` closes only the duplicate. */
    readonly client: Redis;
};
/** A pubsub over Redis pub/sub. */
export declare function redisPubSub(options: RedisPubSubOptions): PubSub;
//# sourceMappingURL=index.d.ts.map
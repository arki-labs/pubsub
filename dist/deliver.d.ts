import type { PubSubBackend } from './telemetry.js';
import type { OnMessage } from './types.js';
/**
 * Hands one message to one subscriber, in a `pubsub.deliver` span. A subscriber that throws, or
 * returns a promise that rejects (an `async` callback is accepted where `OnMessage` returns
 * `void`), is logged at warn and never reaches the other subscribers or becomes an unhandled
 * rejection.
 */
export declare function deliver(backend: PubSubBackend, channel: string, onMessage: OnMessage, payload: string): void;
//# sourceMappingURL=deliver.d.ts.map
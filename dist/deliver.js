import { getLogger } from '@arki/log';
import { observeDelivery } from './telemetry.js';
const log = getLogger('arki:pubsub');
function warnThrown(channel, error) {
    log.warn('a subscriber on {channel} threw: {message}', {
        channel,
        message: error instanceof Error ? error.message : String(error),
    });
}
/**
 * Hands one message to one subscriber, in a `pubsub.deliver` span. A subscriber that throws, or
 * returns a promise that rejects (an `async` callback is accepted where `OnMessage` returns
 * `void`), is logged at warn and never reaches the other subscribers or becomes an unhandled
 * rejection.
 */
export function deliver(backend, channel, onMessage, payload) {
    observeDelivery(backend, () => onMessage(payload), error => warnThrown(channel, error));
}
//# sourceMappingURL=deliver.js.map
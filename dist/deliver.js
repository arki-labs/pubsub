import { getLogger } from '@arki/log';
const log = getLogger('arki:pubsub');
function warnThrown(channel, error) {
    log.warn('a subscriber on {channel} threw: {message}', {
        channel,
        message: error instanceof Error ? error.message : String(error),
    });
}
/**
 * Hands one message to one subscriber. A subscriber that throws, or returns a promise that rejects
 * (an `async` callback is accepted where `OnMessage` returns `void`), is logged at warn and never
 * reaches the other subscribers or becomes an unhandled rejection.
 */
export function deliver(channel, onMessage, payload) {
    try {
        const result = onMessage(payload);
        if (result instanceof Promise)
            result.catch((error) => warnThrown(channel, error));
    }
    catch (error) {
        warnThrown(channel, error);
    }
}
//# sourceMappingURL=deliver.js.map
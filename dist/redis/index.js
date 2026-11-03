import { getLogger } from '@arki/log';
import { deliver } from '../deliver.js';
import { checkChannel, checkMessage, checkOpen } from '../limits.js';
const log = getLogger('arki:pubsub');
/** A pubsub over Redis pub/sub. */
export function redisPubSub(options) {
    const { client } = options;
    const channels = new Map();
    let subscriber;
    let closed = false;
    /** The subscriber connection, made on the first subscribe. */
    function connection() {
        if (subscriber)
            return subscriber;
        const created = client.duplicate();
        created.on('message', (name, payload) => {
            for (const callback of channels.get(name)?.callbacks ?? []) {
                deliver(name, callback, payload);
            }
        });
        created.on('error', (error) => {
            log.warn('redis subscriber connection error: {message}', { message: error.message });
        });
        log.debug('redis subscriber connection opened');
        subscriber = created;
        return created;
    }
    return {
        async publish(channel, payload) {
            checkOpen(closed, 'redis');
            checkMessage(channel, payload);
            await client.publish(channel, payload);
        },
        async subscribe(name, onMessage) {
            checkOpen(closed, 'redis');
            checkChannel(name);
            let channel = channels.get(name);
            if (channel === undefined) {
                channel = { callbacks: new Set(), subscribing: connection().subscribe(name) };
                channels.set(name, channel);
            }
            // Wrapped, so the same function subscribed twice is two subscriptions.
            const subscription = payload => onMessage(payload);
            channel.callbacks.add(subscription);
            const leave = async () => {
                if (!channel.callbacks.delete(subscription) || channel.callbacks.size > 0)
                    return;
                if (channels.get(name) === channel)
                    channels.delete(name);
                if (!closed)
                    await subscriber?.unsubscribe(name);
            };
            try {
                await channel.subscribing;
            }
            catch (error) {
                await leave();
                throw error;
            }
            return leave;
        },
        async close() {
            if (closed)
                return;
            closed = true;
            for (const channel of channels.values())
                channel.callbacks.clear();
            channels.clear();
            if (subscriber)
                await subscriber.quit();
            log.debug('redis pubsub closed');
        },
    };
}
//# sourceMappingURL=index.js.map
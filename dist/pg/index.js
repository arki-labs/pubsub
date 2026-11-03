import { sql } from 'drizzle-orm';
import { listenOnPool } from '@arki/db/pg';
import { getLogger } from '@arki/log';
import { deliver } from '../deliver.js';
import { checkChannel, checkMessage, checkOpen } from '../limits.js';
const log = getLogger('arki:pubsub');
/** A pubsub over Postgres LISTEN/NOTIFY. */
export function pgPubSub(options) {
    const { pool } = options;
    const channels = new Map();
    let closed = false;
    async function stop(name, channel) {
        if (channels.get(name) === channel)
            channels.delete(name);
        let unlisten;
        try {
            unlisten = await channel.listening;
        }
        catch {
            return; // The listen never started (its subscriber got the error), so nothing to stop.
        }
        await unlisten();
    }
    return {
        async publish(channel, payload) {
            checkOpen(closed, 'pg');
            checkMessage(channel, payload);
            await pool.query('select pg_notify($1, $2)', [channel, payload]);
        },
        async publishIn(tx, channel, payload) {
            checkOpen(closed, 'pg');
            checkMessage(channel, payload);
            await tx.execute(sql `select pg_notify(${channel}, ${payload})`);
        },
        async subscribe(name, onMessage) {
            checkOpen(closed, 'pg');
            checkChannel(name);
            let channel = channels.get(name);
            if (channel === undefined) {
                log.debug('listening on {channel}', { channel: name });
                const callbacks = new Set();
                const listening = listenOnPool(pool, name, options.listen)(payload => {
                    for (const callback of callbacks) {
                        deliver(name, callback, payload);
                    }
                });
                channel = { callbacks, listening };
                channels.set(name, channel);
            }
            // Wrapped, so the same function subscribed twice is two subscriptions.
            const subscription = payload => onMessage(payload);
            channel.callbacks.add(subscription);
            const leave = async () => {
                if (!channel.callbacks.delete(subscription) || channel.callbacks.size > 0)
                    return;
                await stop(name, channel);
            };
            try {
                await channel.listening;
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
            const open = [...channels];
            for (const [, channel] of open)
                channel.callbacks.clear();
            await Promise.all(open.map(([name, channel]) => stop(name, channel)));
            log.debug('pg pubsub closed');
        },
    };
}
//# sourceMappingURL=index.js.map
import { sql } from 'drizzle-orm';
import { listenOnPool, ListenUnavailable } from '@arki/db/pg';
import { getLogger } from '@arki/log';
import { deliver } from '../deliver.js';
import { checkChannel, checkMessage, checkOpen } from '../limits.js';
import { observePublish } from '../telemetry.js';
const log = getLogger('arki:pubsub');
/**
 * A pubsub over Postgres LISTEN/NOTIFY. `subscribe` resolves to `db.listen_unavailable`
 * (`ListenUnavailable` from `@arki/db/pg`) when the channel's first connection or `LISTEN` fails.
 */
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
        // The listen never started (its subscribers got the failure), so nothing to stop.
        if (ListenUnavailable.is(unlisten))
            return;
        await unlisten();
    }
    return {
        async publish(channel, payload) {
            await observePublish('publish', 'pg', async () => {
                checkOpen(closed, 'pg');
                checkMessage(channel, payload);
                await pool.query('select pg_notify($1, $2)', [channel, payload]);
            });
        },
        async publishIn(tx, channel, payload) {
            await observePublish('publish_in', 'pg', async () => {
                checkOpen(closed, 'pg');
                checkMessage(channel, payload);
                await tx.execute(sql `select pg_notify(${channel}, ${payload})`);
            });
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
                        deliver('pg', name, callback, payload);
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
            let listened;
            try {
                listened = await channel.listening;
            }
            catch (error) {
                await leave();
                throw error;
            }
            if (ListenUnavailable.is(listened)) {
                log.debug('{channel}: the listener could not start', { channel: name });
                await leave();
                return listened;
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
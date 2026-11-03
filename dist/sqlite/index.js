import { and, asc, gt, inArray, lt, max, sql } from 'drizzle-orm';
import { unrefTimer } from '@arki/db/sqlite';
import { sqliteNowMs } from '@arki/db/sqlite';
import { getLogger } from '@arki/log';
import { PubSubError } from '../errors.js';
import { deliver } from '../deliver.js';
import { checkChannel, checkMessage, checkOpen } from '../limits.js';
import { pubsubTable } from './table.js';
export { pubsubTable } from './table.js';
const log = getLogger('arki:pubsub');
/** How many rows one poll reads at most; the next poll goes on from there. */
const POLL_BATCH = 1000;
function positive(name, value) {
    if (!Number.isFinite(value) || value <= 0) {
        throw new PubSubError({
            code: 'config',
            message: `sqlitePubSub(): ${name} must be a positive number of milliseconds, got ${value}`,
            remediation: `Pass a positive ${name}, or leave it out for the default.`,
        });
    }
    return value;
}
export function sqlitePubSub(options) {
    const { db } = options;
    const table = options.table ?? pubsubTable();
    const intervalMs = positive('intervalMs', options.intervalMs ?? 250);
    const retainMs = positive('retainMs', options.retainMs ?? 60_000);
    const channels = new Map();
    let cursor = 0;
    let closed = false;
    let timer;
    let polling;
    async function insert(handle, channel, payload) {
        await handle.insert(table).values({ channel, payload });
        await handle.delete(table).where(lt(table.createdAt, sql `${sqliteNowMs} - ${retainMs}`));
    }
    async function pollOnce() {
        if (channels.size === 0)
            return;
        const rows = await db
            .select({ id: table.id, channel: table.channel, payload: table.payload })
            .from(table)
            .where(and(gt(table.id, cursor), inArray(table.channel, [...channels.keys()])))
            .orderBy(asc(table.id))
            .limit(POLL_BATCH)
            .catch((error) => {
            log.warn('poll failed, trying again in {intervalMs} ms: {message}', {
                intervalMs,
                message: error instanceof Error ? error.message : String(error),
            });
            return [];
        });
        for (const row of rows) {
            cursor = Math.max(cursor, row.id);
            for (const subscription of channels.get(row.channel) ?? []) {
                if (row.id <= subscription.after || !channels.get(row.channel)?.has(subscription))
                    continue;
                deliver(row.channel, subscription.onMessage, row.payload);
            }
        }
    }
    function schedule() {
        if (closed || timer !== undefined || polling !== undefined || channels.size === 0)
            return;
        timer = setTimeout(() => {
            timer = undefined;
            polling = pollOnce().finally(() => {
                polling = undefined;
                schedule();
            });
        }, intervalMs);
        unrefTimer(timer);
    }
    return {
        async publish(channel, payload) {
            checkOpen(closed, 'sqlite');
            checkMessage(channel, payload);
            await insert(db, channel, payload);
        },
        async publishIn(tx, channel, payload) {
            checkOpen(closed, 'sqlite');
            checkMessage(channel, payload);
            await insert(tx, channel, payload);
        },
        async subscribe(channel, onMessage) {
            checkOpen(closed, 'sqlite');
            checkChannel(channel);
            const [newest] = await db.select({ id: max(table.id) }).from(table);
            const after = newest?.id ?? 0;
            checkOpen(closed, 'sqlite');
            // Nobody listened: start the shared cursor here. Otherwise it is at or below `after` already.
            if (channels.size === 0) {
                cursor = Math.max(cursor, after);
                log.debug('poll loop started, every {intervalMs} ms', { intervalMs });
            }
            const subscription = { onMessage, after };
            const set = channels.get(channel) ?? new Set();
            set.add(subscription);
            channels.set(channel, set);
            schedule();
            return async () => {
                set.delete(subscription);
                if (set.size === 0 && channels.get(channel) === set)
                    channels.delete(channel);
                if (channels.size > 0 || timer === undefined)
                    return;
                clearTimeout(timer);
                timer = undefined;
                log.debug('poll loop stopped: no subscribers');
            };
        },
        async close() {
            if (closed)
                return;
            closed = true;
            if (timer !== undefined)
                clearTimeout(timer);
            timer = undefined;
            channels.clear();
            await polling;
            log.debug('sqlite pubsub closed');
        },
    };
}
//# sourceMappingURL=index.js.map
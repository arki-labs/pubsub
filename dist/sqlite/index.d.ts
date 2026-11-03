/**
 * `@arki/pubsub/sqlite`: messages in a SQLite table, read by polling. Works on
 * libSQL (`createLibsqlDb` from `@arki/db/libsql`) and publishes inside a
 * transaction with `publishIn`.
 */
import type { AnyRelations } from 'drizzle-orm';
import type { SQLiteAsyncDatabase } from 'drizzle-orm/sqlite-core';
import type { TransactionalPubSub } from '../types.js';
import type { PubsubTable } from './table.js';
export type { PubsubTable } from './table.js';
export { pubsubTable } from './table.js';
/** Any async Drizzle SQLite database or transaction; libSQL is the one `@arki/db` supports. */
export type SqlitePubSubDb = SQLiteAsyncDatabase<'async', unknown, AnyRelations>;
export type SqlitePubSubOptions<TDb> = {
    /** The Drizzle database the table lives in. Subscribers read through it; `publish` writes through it. */
    readonly db: TDb;
    /** The table from `pubsubTable()`. Default: `pubsubTable()`, named `arki_pubsub`. */
    readonly table?: PubsubTable;
    /** How often subscribers read new rows, in milliseconds. Default 250. */
    readonly intervalMs?: number;
    /** Rows older than this many milliseconds are deleted by the next publisher. Default 60000. */
    readonly retainMs?: number;
};
/** The transaction type `db.transaction(fn)` hands to `fn`, read off the database. */
type TransactionOf<TDb extends SqlitePubSubDb> = Parameters<Parameters<TDb['transaction']>[0]>[0];
/**
 * A pubsub over a SQLite message table. Each subscriber starts at the newest row
 * when it subscribes; one loop per pubsub reads `id > cursor` for the subscribed
 * channels every `intervalMs`. `publishIn(tx, …)` inserts the row in your
 * transaction: it is seen at commit and never if the transaction rolls back.
 * SQLite has one writer, so ids commit in order and no row is skipped.
 */
export declare function sqlitePubSub<TDb extends SqlitePubSubDb>(options: SqlitePubSubOptions<TDb>): TransactionalPubSub<TransactionOf<TDb>>;
//# sourceMappingURL=index.d.ts.map
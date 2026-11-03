/**
 * `@arki/pubsub/pg`: Postgres LISTEN/NOTIFY. `publish` runs `pg_notify` on the
 * pool; `publishIn(tx, …)` runs it inside your transaction, so Postgres sends it
 * at commit and drops it on rollback. Each channel is heard on one dedicated
 * client of the pool (`listenOnPool` from `@arki/db/pg`), shared by all
 * subscriptions of this pubsub.
 *
 * The pool must hand out real sessions. Behind a transaction pooler
 * (PgBouncer in transaction mode, Supavisor :6543, Neon's `-pooler` host) LISTEN
 * is lost between statements: connect to the direct host (`sessionPool` from
 * `@arki/db/dot`).
 */
import type { AnyRelations } from 'drizzle-orm';
import type { PgAsyncTransaction, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { ListenOptions, ListenPool } from '@arki/db/pg';
import type { TransactionalPubSub } from '../types.js';
/** A `pg` pool (`new pg.Pool(...)`, or a Drizzle node-postgres database's `$client`): it hands out listen clients and runs `pg_notify`. */
export type PgPubSubPool = ListenPool & {
    query(text: string, values: unknown[]): Promise<unknown>;
};
/** Any Drizzle Postgres transaction (node-postgres, postgres.js, PGlite, …). */
export type PgTransaction = PgAsyncTransaction<PgQueryResultHKT, AnyRelations>;
export type PgPubSubOptions = {
    /** A session pool on the direct host, never a transaction pooler. Not closed by `close()`. */
    readonly pool: PgPubSubPool;
    /** Reconnect and health-check timing of the listen clients. */
    readonly listen?: ListenOptions;
};
/** A pubsub over Postgres LISTEN/NOTIFY. */
export declare function pgPubSub(options: PgPubSubOptions): TransactionalPubSub<PgTransaction>;
//# sourceMappingURL=index.d.ts.map
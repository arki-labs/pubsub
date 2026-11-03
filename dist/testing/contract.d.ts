import type { PubSub, TransactionalPubSub } from '../types.js';
/** A fresh pubsub for one case. The suite closes it. */
export type PubSubSubject = {
    readonly pubsub: PubSub;
};
/** A fresh transactional pubsub for one case, with a way to open a transaction it can publish in. */
export type TransactionalPubSubSubject<Tx> = {
    readonly pubsub: TransactionalPubSub<Tx>;
    /** Runs `fn` in one transaction: commits when it resolves, rolls back when it throws. Usually `fn => db.transaction(fn)`. */
    readonly transaction: (fn: (tx: Tx) => Promise<void>) => Promise<void>;
};
export type PubSubContractOptions = {
    /** How long to wait before saying nothing arrived. Default 150 ms; a polling backend needs a few intervals. */
    readonly settleMs?: number;
    /** How long to wait for a message that must arrive. Default 5000 ms. */
    readonly timeoutMs?: number;
    /** True when two `make()` results share one transport (a database or a server), so one hears the other. Default true. */
    readonly shared?: boolean;
};
/**
 * Register the conformance cases with vitest. `make` returns a fresh pubsub per case; return
 * `{ pubsub, transaction }` for a backend with `publishIn` to run the transaction cases too.
 */
export declare function describePubSubContract<Tx>(name: string, make: () => Promise<PubSubSubject | TransactionalPubSubSubject<Tx>>, options?: PubSubContractOptions): void;
//# sourceMappingURL=contract.d.ts.map
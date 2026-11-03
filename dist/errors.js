/**
 * Everything `@arki/pubsub` raises on purpose is a thrown {@link PubSubError}
 * with a stable `code`. Match on `code` (or `errorCode`), never on the message.
 */
/** Stable ids, one per `PubSubError.code`. Never renumber. */
export const PUBSUB_ERROR_CODES = {
    /**
     * The channel is not 1 to 63 characters of `[a-z0-9_]` (a Postgres identifier).
     *
     * @fix Use a short lower-case name such as `orders_changed`.
     * @verify bun run test -- src/testing/memory.contract.test.ts
     */
    channel: 'ARKI_PUBSUB_E001',
    /**
     * The payload is 8000 bytes or more in UTF-8 (NOTIFY refuses it; the limit is 7999).
     *
     * @fix Send an id and let the subscriber read the rest from the database.
     * @verify bun run test -- src/testing/memory.contract.test.ts
     */
    payload: 'ARKI_PUBSUB_E002',
    /**
     * The pubsub was closed; it cannot publish or subscribe any more.
     *
     * @fix Make a new pubsub, or close it only when the app shuts down.
     * @verify bun run test -- src/testing/memory.contract.test.ts
     */
    closed: 'ARKI_PUBSUB_E003',
    /**
     * Bad setup: a non-positive `intervalMs` or `retainMs`.
     *
     * @fix Fix the option named in the message.
     * @verify bun run test -- src/sqlite/sqlite.test.ts
     */
    config: 'ARKI_PUBSUB_E004',
};
/** A thrown, coded error of `@arki/pubsub`: a bad call or a closed pubsub. */
export class PubSubError extends Error {
    code;
    /** The stable id of `code`, e.g. `ARKI_PUBSUB_E001`. */
    errorCode;
    /** What to do about it, in one sentence. */
    remediation;
    constructor(init) {
        const errorCode = PUBSUB_ERROR_CODES[init.code];
        super(`${errorCode}: ${init.message}`);
        this.name = 'PubSubError';
        this.code = init.code;
        this.errorCode = errorCode;
        this.remediation = init.remediation;
    }
}
//# sourceMappingURL=errors.js.map
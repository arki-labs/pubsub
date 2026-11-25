/** The backend, as the `pubsub.backend` attribute and metric dimension. */
export type PubSubBackend = 'memory' | 'pg' | 'redis' | 'sqlite';
/** One `publish` or `publishIn` in a `pubsub.publish` / `pubsub.publish_in` span, counted by outcome. Errors pass through unchanged. */
export declare function observePublish(operation: 'publish' | 'publish_in', backend: PubSubBackend, execute: () => Promise<void>): Promise<void>;
/**
 * One delivery to one subscriber in a `pubsub.deliver` span: from the call until the callback
 * returns, or until the promise it returned settles. `fail` gets what the callback threw or
 * rejected with; the span is marked failed either way.
 */
export declare function observeDelivery(backend: PubSubBackend, onMessage: () => unknown, fail: (error: unknown) => void): void;
/**
 * One SQLite poll that has finished its read. Every poll is counted. Only a poll that read rows
 * or failed gets a `pubsub.sqlite.poll` span (started at `startTime`, so it covers the read): an
 * idle poll every `intervalMs` is not worth a trace. `deliverRows` runs inside that span, so each
 * `pubsub.deliver` nests under the poll that read its row.
 */
export declare function observePoll(startTime: number, read: {
    readonly rows: number;
} | {
    readonly rows: 0;
    readonly thrown: unknown;
}, deliverRows: () => void): void;
//# sourceMappingURL=telemetry.d.ts.map
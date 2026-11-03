/** A channel name: a Postgres identifier of 1 to 63 characters of `[a-z0-9_]`. */
export declare const CHANNEL_PATTERN: RegExp;
/** The largest payload, in UTF-8 bytes. Postgres NOTIFY refuses 8000 bytes or more, so the limit is 7999. */
export declare const MAX_PAYLOAD_BYTES = 7999;
/** Throws a `channel` {@link PubSubError} unless `channel` matches {@link CHANNEL_PATTERN}. */
export declare function checkChannel(channel: string): void;
/** Throws unless `channel` is valid and `payload` fits in {@link MAX_PAYLOAD_BYTES}. */
export declare function checkMessage(channel: string, payload: string): void;
/** Throws a `closed` {@link PubSubError} when `closed` is true. */
export declare function checkOpen(closed: boolean, backend: string): void;
//# sourceMappingURL=limits.d.ts.map
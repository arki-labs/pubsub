import { context, metrics, SpanStatusCode, trace } from '@opentelemetry/api';
import { PubSubError } from './errors.js';
const SCOPE = '@arki/pubsub';
/** Runs one reporting call. An SDK that throws cannot reach the caller. */
function quietly(report) {
    try {
        report();
    }
    catch {
        // Telemetry is best effort: it has no say over the operation it observes.
    }
}
function startSpan(name, attributes, startTime) {
    let span;
    quietly(() => {
        span = trace.getTracer(SCOPE).startSpan(name, startTime === undefined ? { attributes } : { attributes, startTime });
    });
    return span;
}
/** A bounded name for a thrown error: the `ARKI_PUBSUB_E…` id, else the error class. Never the message. */
function errorType(error) {
    if (error instanceof PubSubError)
        return error.errorCode;
    return error instanceof Error ? error.name : typeof error;
}
function failSpan(span, error) {
    quietly(() => span?.setAttribute('error.type', errorType(error)));
    quietly(() => span?.setStatus({ code: SpanStatusCode.ERROR }));
}
function count(operation, backend, outcome) {
    quietly(() => metrics.getMeter(SCOPE).createCounter('pubsub.operations').add(1, { operation, backend, outcome }));
}
/**
 * Calls `run` exactly once with `span` active, so spans the work starts (the driver's, a
 * subscriber's) nest under it. A context manager that throws cannot skip the call, repeat it or
 * swallow what it threw.
 */
function inSpan(span, run) {
    let ran;
    const once = () => {
        if (ran !== undefined)
            return ran;
        try {
            ran = { ok: true, value: run() };
        }
        catch (error) {
            ran = { ok: false, error };
        }
        return ran;
    };
    if (span !== undefined)
        quietly(() => context.with(trace.setSpan(context.active(), span), once));
    const settled = once();
    if (!settled.ok)
        throw settled.error;
    return settled.value;
}
/** One `publish` or `publishIn` in a `pubsub.publish` / `pubsub.publish_in` span, counted by outcome. Errors pass through unchanged. */
export async function observePublish(operation, backend, execute) {
    const span = startSpan(`pubsub.${operation}`, { 'pubsub.backend': backend });
    try {
        await inSpan(span, execute);
        count(operation, backend, 'success');
    }
    catch (error) {
        failSpan(span, error);
        count(operation, backend, 'error');
        throw error;
    }
    finally {
        quietly(() => span?.end());
    }
}
/**
 * One delivery to one subscriber in a `pubsub.deliver` span: from the call until the callback
 * returns, or until the promise it returned settles. `fail` gets what the callback threw or
 * rejected with; the span is marked failed either way.
 */
export function observeDelivery(backend, onMessage, fail) {
    const span = startSpan('pubsub.deliver', { 'pubsub.backend': backend });
    const settle = (error) => {
        if (error !== undefined) {
            fail(error.thrown);
            failSpan(span, error.thrown);
        }
        count('deliver', backend, error === undefined ? 'success' : 'error');
        quietly(() => span?.end());
    };
    let result;
    try {
        result = inSpan(span, onMessage);
    }
    catch (error) {
        settle({ thrown: error });
        return;
    }
    if (result instanceof Promise) {
        result.then(() => settle(), (error) => settle({ thrown: error }));
        return;
    }
    settle();
}
/**
 * One SQLite poll that has finished its read. Every poll is counted. Only a poll that read rows
 * or failed gets a `pubsub.sqlite.poll` span (started at `startTime`, so it covers the read): an
 * idle poll every `intervalMs` is not worth a trace. `deliverRows` runs inside that span, so each
 * `pubsub.deliver` nests under the poll that read its row.
 */
export function observePoll(startTime, read, deliverRows) {
    const failed = 'thrown' in read;
    count('poll', 'sqlite', failed ? 'error' : 'success');
    if (read.rows === 0 && !failed) {
        deliverRows();
        return;
    }
    const span = startSpan('pubsub.sqlite.poll', { 'pubsub.backend': 'sqlite', 'pubsub.messages': read.rows }, startTime);
    if (failed)
        failSpan(span, read.thrown);
    try {
        inSpan(span, deliverRows);
    }
    finally {
        quietly(() => span?.end());
    }
}
//# sourceMappingURL=telemetry.js.map
import { TypedEmitter, EventsDefinition } from './events';
import { MagicSDKError, MagicRPCError } from '../core/sdk-exceptions';

/**
 * Extends `Promise` with a polymorphic `this` type to accomodate arbitrary
 * `Promise` API extensions.
 */
interface ExtendedPromise<T> extends Promise<T> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): ExtendedPromise<TResult1 | TResult2> & this;

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
  ): ExtendedPromise<T | TResult> & this;

  finally(onfinally?: (() => void) | undefined | null): ExtendedPromise<T> & this;
}

/**
 * A `Promise` and `EventEmitter` all in one!
 */
export type PromiEvent<TResult, TEvents extends EventsDefinition = void> = ExtendedPromise<TResult> &
  TypedEmitter<TEvents extends void ? DefaultEvents<TResult> : TEvents & DefaultEvents<TResult>>;

/**
 * Default events attached to every `PromiEvent`.
 */
type DefaultEvents<TResult> = {
  done: (result: TResult) => void;
  error: (err: MagicSDKError | MagicRPCError) => void;
  settled: () => void;
};

/**
 * A `Promise` executor with can be optionally asynchronous.
 */
type AsyncPromiseExecutor<TResult> = (
  resolve: (value?: TResult | PromiseLike<TResult>) => void,
  reject: (reason?: any) => void,
) => void | Promise<void>;

/**
 * Create a native JavaScript `Promise` overloaded with strongly-typed methods
 * from `EventEmitter`.
 */
export function createPromiEvent<TResult, TEvents extends EventsDefinition = void>(
  executor: AsyncPromiseExecutor<TResult>,
): PromiEvent<TResult, TEvents extends void ? DefaultEvents<TResult> : TEvents & DefaultEvents<TResult>> {
  const promise = createAutoCatchingPromise(executor);
  const eventEmitter = new TypedEmitter<TEvents & DefaultEvents<TResult>>();

  // We save the original `Promise` methods to the following symbols so we can
  // access them internally.
  const thenSymbol = Symbol('Promise.then');
  const catchSymbol = Symbol('Promise.catch');
  const finallySymbol = Symbol('Promise.finally');

  /**
   * Ensures the next object in the `PromiEvent` chain is overloaded with
   * `EventEmitter` methods.
   */
  const createChainingPromiseMethod = (
    method: typeof thenSymbol | typeof catchSymbol | typeof finallySymbol,
    source: Promise<any>,
  ) => (...args: any[]) => {
    const nextPromise = (source as any)[method].apply(source, args);
    return promiEvent(nextPromise);
  };

  /**
   * Applies the desired `EventEmitter` method and returns the source
   * `PromiEvent`.
   */
  const createChainingEmitterMethod = (method: keyof typeof eventEmitter, source: Promise<any>) => (...args: any[]) => {
    (eventEmitter as any)[method].apply(eventEmitter, args);
    return source;
  };

  /**
   * Applies an `EventEmitter` method which returns a non-`PromiEvent` result.
   */
  const createBoundEmitterMethod = (method: keyof typeof eventEmitter) => (...args: any[]) => {
    return (eventEmitter as any)[method].apply(eventEmitter, args);
  };

  /**
   * Builds a `PromiEvent` by assigning `EventEmitter` methods to a native
   * `Promise` object.
   */
  const promiEvent = (source: any) => {
    return Object.assign(source, {
      [thenSymbol]: source[thenSymbol] || source.then,
      [catchSymbol]: source[catchSymbol] || source.catch,
      [finallySymbol]: source[finallySymbol] || source.finally,

      then: createChainingPromiseMethod(thenSymbol, source),
      catch: createChainingPromiseMethod(catchSymbol, source),
      finally: createChainingPromiseMethod(finallySymbol, source),

      addListener: createChainingEmitterMethod('addListener', source),
      on: createChainingEmitterMethod('on', source),
      once: createChainingEmitterMethod('once', source),

      off: createChainingEmitterMethod('off', source),
      removeAllListeners: createChainingEmitterMethod('removeAllListeners', source),
      removeListener: createChainingEmitterMethod('removeListener', source),

      emit: createBoundEmitterMethod('emit'),
      eventNames: createBoundEmitterMethod('eventNames'),
      listeners: createBoundEmitterMethod('listeners'),
      listenerCount: createBoundEmitterMethod('listenerCount'),
    });
  };

  const result = promiEvent(
    promise.then(
      resolved => {
        // Emit default completion events and resolve result.
        result.emit('done', resolved);
        result.emit('settled');
        return resolved;
      },

      err => {
        // Emit default error events and re-throw.
        result.emit('error', err);
        result.emit('settled');
        throw err;
      },
    ),
  );

  return result;
}

/**
 * Creates a `Promise` with an **async executor** that automatically catches
 * errors occurring within the executor. Nesting promises in this way is usually
 * deemed an _anti-pattern_, but it's useful and clean when promisifying the
 * event-based code that's inherent to JSON RPC.
 *
 * So, here we solve the issue of nested promises by ensuring that no errors
 * mistakenly go unhandled!
 */
export function createAutoCatchingPromise<TResult>(executor: AsyncPromiseExecutor<TResult>) {
  return new Promise<TResult>((resolve, reject) => {
    const result = executor(resolve, reject);
    Promise.resolve(result).catch(reject);
  });
}

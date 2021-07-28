import safeJsonStringify = require('safe-json-stringify')

/**
 * A safe version of `JSON.stringify` that safely handles circular references
 * and getters that throw.
 *
 * @param obj see `JSON.stringify`
 * @param replacer see `JSON.stringify`
 * @param space see `JSON.stringify`
 * @returns
 */
export function safeStringify(obj: any, replacer?: (this: any, key: any, value: any) => any | (string | number)[] | null, space?: string | number): string {
  try {
    // fast-path
    return JSON.stringify(obj, replacer, space)
  } catch(_) {
    return safeJsonStringify(obj, replacer, space)
  }
}

/**
 * Returns an output function that writes stringified JSON to the provided
 * stream.
 *
 * @param writeableStream stream to output to
 * @returns an output function
 */
export function jsonToStream(writeableStream: { write(o: unknown): unknown }) {
  return function outputToStream (logObj: object) {
    writeableStream.write(safeStringify(logObj) + "\n")
  }
}

/**
 * A log output function that uses `console.log` (works in browsers)
 *
 * @param logObj
 */
export function jsonToConsole(logObj: object) {
  console.log(safeStringify(logObj))
}

export const jsonToStdout = process?.stdout ? jsonToStream(process.stdout) : jsonToConsole

function buildFullErrorStack(err: { [k: string]: unknown }): string {
  let ret: string = String(err.stack)
  try {
    while(err && err.cause && typeof err.cause === 'function') {
      err = err.cause()
      if (err.stack) {
        ret += '\nCaused by: ' + String(err.stack)
      }
    }
  } catch(e) {
    // noop
  }
  return ret
}

/**
 * A field value transformation function that transforms objects that are
 * subclasses of Error so that they can be easily JSON-stringified. Also
 * unwinds any Error causes, if the error is a so-called `verror`.
 *
 * @param err an error object, or any other value
 * @returns a
 */
export function transformError(err: unknown): unknown {
  if (!(err instanceof Error)) {
      return err
  }
  const ret: any = {
    // Capture any enumerable properties off the error
    ...err,
    stack: buildFullErrorStack(err as any)
  }
  if (err.message !== undefined) ret.message = err.message
  if (err.name !== undefined) ret.name = err.name
  if ((err as any).code !== undefined) ret.code = (err as any).code
  if ((err as any).signal !== undefined) ret.signal = (err as any).signal
  return ret
}

const hop = Object.prototype.hasOwnProperty

export type ProcessFieldFunction = (value: unknown, key: string | symbol, obj: object) => unknown
type Transformation = {
  [k in string | symbol]: ProcessFieldFunction | Transformation
}

type OverloadedProcessFunction = {
  (v: object): object | void
  (v: unknown): unknown
}

/**
 * Creates a ProcessFunction that transforms an object according to the
 * provided transformation. Supports nested transformations. For example:
 *
 * ```javascript
 * const trans = transform({
 *   a: {
 *     b: () => undefined ,
 *     c: () => false
 *   },
 *   z: (v: unknown) => typeof v === 'number' ? v + 1 : v
 * })
 *
 * console.log(
 *   trans({
 *     a: {
 *       b: 'b',
 *       d: 'd',
 *     }
 *     z: 2
 *   })
 * )
 * // { a: { b: undefined, d: 'd' }, z: 3 }
 * ````
 *
 * @param transformation the transformation object; individual field
 *   transformations will only be run if a field is defined
 * @returns a function that will do the transforming
 */
export function transform(transformation: Transformation): OverloadedProcessFunction {
  const transKV = Object.entries(transformation).map(([k, fnOrTrans])  => {
    if (typeof fnOrTrans === 'function') {
      return [k, fnOrTrans] as const
    }
    return [k, transform(fnOrTrans)] as const
  })

  function _transform(value: object): object
  function _transform(value: unknown): unknown
  function _transform(value: object | unknown): object | unknown {
    if (typeof value === 'object' && value !== null) {
      let anyDifferent = false
      const overrides: any = {}
      for (const [key, transform] of transKV) {
        if (hop.call(value, key)) {
          try {
            const oldVal = (value as any)[key]
            const newVal = transform(oldVal, key, value)
            if (oldVal !== newVal) {
              anyDifferent = true
              overrides[key] = newVal
            }
          } catch(_) {
            // noop
          }
        }
      }
      if (anyDifferent) {
        return { ...value, ...overrides }
      }
    }

    return value
  }

  return _transform
}

/**
 * A field transformation that changes its value to a redacted version.
 * If the field is a string a non-zero length is provided then that many
 * characters are kept (from the front if len is positive or from the end
 * otherwise).
 *
 * @param len how much of the original string to keep, if any
 * @param text what the redacted portion should look like
 * @returns a field processing function
 */
export function redact(len: number = 0, text: string = '[REDACTED]'): ProcessFieldFunction {
  if (len === 0) {
    return () => text
  } else if (len > 0) {
    return (s: unknown): unknown =>
      (typeof s === 'string' ? s.slice(0, len) : '') + text
  } else { // len < 0
    return (s: unknown): unknown =>
      text + (typeof s === 'string' ? s.slice(len) : '')
  }
}

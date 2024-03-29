import safeJsonStringify = require('safe-json-stringify')

export function safeStringify(obj: any, replacer?: (this: any, key: any, value: any) => any | (string | number)[] | null, space?: string | number) {
  try {
    return JSON.stringify(obj, replacer, space)
  } catch(_) {
    return safeJsonStringify(obj, replacer, space)
  }
}

export function jsonToStream(s: { write(o: unknown): unknown }) {
  return function outputToStream (p: object) {
    s.write(safeStringify(p) + "\n")
  }
}

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

export function transformError(err: any): any {
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
  // Typescript narrowing is a bit aggressive here
  if ((err as any).code !== undefined) ret.code = (err as any).code
  if ((err as any).signal !== undefined) ret.signal = (err as any).signal
  return ret
}

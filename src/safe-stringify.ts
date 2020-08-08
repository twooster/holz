import fastSafeStringify from 'fast-safe-stringify'

export const safeStringify = (o: object) => {
  try {
    return JSON.stringify(o)
  } catch (_) {
    return fastSafeStringify(o)
  }
}

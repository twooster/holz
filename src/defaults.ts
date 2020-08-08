import { format as defaultFormat } from 'util'

import { transformError } from './transform-error'
import { safeStringify } from './safe-stringify'

export { defaultFormat }

export const defaultOutput =
  (p: object) => process.stdout.write(safeStringify(p) + "\n")

export const defaultTransform =
  (o: object) => o instanceof Error ? { error: transformError(o) } : o

export const defaultLevels = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
} as const

export const defaultLevelOutput = 'string' as const

export const defaultLevelKey = 'level'

export const defaultMessageKey = 'msg'

export const defaultLevel = defaultLevels['info']

export const defaultFieldTransforms = {
  err: transformError,
  error: transformError,
}

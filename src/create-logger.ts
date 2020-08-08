import { format as defaultFormat } from 'util'

import { LoggerOpts, LevelMapping, BaseLogger, Logger } from './logger'

import { transformError, toStream } from './util'

export { defaultFormat }

export const defaultOutput = toStream(process.stdout)

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


type CreateLoggerOptsWithoutLevels = Partial<Exclude<LoggerOpts<typeof defaultLevels>, 'levels'>>
type CreateLoggerOpts<T extends LevelMapping> = Partial<Exclude<LoggerOpts<T>, 'levels' | 'level'>> & Pick<LoggerOpts<T>, 'levels' | 'level'>

export function createLogger(opts: CreateLoggerOptsWithoutLevels): Logger<typeof defaultLevels>
export function createLogger<T extends LevelMapping>(opts: CreateLoggerOpts<T>): Logger<T>
export function createLogger<T extends LevelMapping>(opts: CreateLoggerOpts<T> | CreateLoggerOptsWithoutLevels = {}): Logger<T> {
  return new BaseLogger({
    // We know these will be overridden by the expansion below,
    // but typescript needs a bit of help
    levels: defaultLevels as any,
    level: defaultLevel as any,
    levelKey: defaultLevelKey,
    messageKey: defaultMessageKey,
    levelOutput: defaultLevelOutput,
    fieldTransforms: defaultFieldTransforms,
    format: defaultFormat,
    output: defaultOutput,
    transform: defaultTransform,
    ...opts
  }) as Logger<T>
}

import { LoggerOpts, LevelMapping, BaseLogger, Logger } from './logger'
import { transformError, jsonToStdout, transform } from './util'

export const defaultOutput = jsonToStdout

export function defaultPreprocess(o: object): object {
  if (o instanceof Error) {
    return { error: transformError(o) }
  }
  return o
}

export const defaultPostprocess = transform({
  error: transformError,
  err: transformError
})

export const defaultLevels = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
} as const

export const defaultNumericLevel = false
export const defaultLevelKey = 'level'
export const defaultMessageKey = 'msg'
export const defaultLevel = defaultLevels['info']

type CreateLoggerOptsWithoutLevels = Partial<Exclude<LoggerOpts<typeof defaultLevels>, 'levels'>>
type CreateLoggerOpts<T extends LevelMapping> = Partial<Exclude<LoggerOpts<T>, 'levels' | 'level'>> & Pick<LoggerOpts<T>, 'levels' | 'level'>

export function createLogger(opts?: CreateLoggerOptsWithoutLevels): Logger<typeof defaultLevels>
export function createLogger<T extends LevelMapping>(opts: CreateLoggerOpts<T>): Logger<T>
export function createLogger<T extends LevelMapping>(opts: CreateLoggerOpts<T> | CreateLoggerOptsWithoutLevels = {}): Logger<T> {
  return new BaseLogger({
    // We know these will be overridden by the expansion below,
    // but typescript needs a bit of help
    levels: defaultLevels as any,
    level: defaultLevel as any,
    levelKey: defaultLevelKey,
    messageKey: defaultMessageKey,
    numericLevel: defaultNumericLevel,
    output: defaultOutput,
    preprocess: defaultPreprocess,
    postprocess: defaultPostprocess,
    ...opts
  }) as Logger<T>
}

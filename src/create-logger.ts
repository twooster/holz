import { LoggerOpts, LevelMapping, BaseLogger, Logger } from './logger'

import {
  defaultFieldTransforms,
  defaultFormat,
  defaultLevel,
  defaultLevelKey,
  defaultLevelOutput,
  defaultLevels,
  defaultMessageKey,
  defaultOutput,
  defaultTransform
} from './defaults'

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

import test from 'ava'
import {
  createLogger,
  defaultLevels,
  defaultFormat,
  defaultFieldTransforms,
  defaultTransform,
  defaultLevelOutput,
  defaultLevelKey,
  defaultMessageKey,
} from '../create-logger'

test('can create a logger', t => {
  const logger = createLogger()
  t.is(logger.level, defaultLevels.info)
  t.is(logger.base, undefined)
  t.is(logger.fields, undefined)
  t.is(logger.levels, defaultLevels)
  t.is(logger.fieldTransforms, defaultFieldTransforms)
  t.is(logger.transform, defaultTransform)
  t.is(logger.levelOutput, defaultLevelOutput)
  t.is(logger.levelKey, defaultLevelKey)
  t.is(logger.messageKey, defaultMessageKey)
  t.is(logger.format, defaultFormat)
})

test('can create a logger with a level', t => {
  const logger = createLogger({ level: 'error' })
  t.is(logger.level, defaultLevels.error)
})

test('can create a logger with custom levels', t => {
  const levels = { foo: 1, bar: 2 }
  const logger = createLogger({ levels, level: 'bar' })
  t.is(logger.level, levels.bar)
  t.is(logger.levels, levels)
})

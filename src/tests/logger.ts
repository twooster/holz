import test from 'ava'
import * as td from 'testdouble'

import { LoggerOpts, Logger, BaseLogger, levelStringSym, levelNumberSym } from '../logger'

const debugNum = 10
const infoNum = 20
const errorNum = 30
const testLevels = { debug: debugNum, info: infoNum, error: errorNum } as const

function makeLogger(o: Partial<LoggerOpts<typeof testLevels>> = {}) {
  return new BaseLogger<typeof testLevels>({
    levels: testLevels,
    level: 'info',
    levelKey: 'l',
    messageKey: 'm',
    levelOutput: 'string',
    fieldTransforms: {},
    format: (msg: string, ...args) => [msg, ...args].join(''),
    output: (_: any) => undefined,
    transform: (o: any) => o,
    ...o
  }) as Logger<typeof testLevels>
}

test('levels work', t => {
  const output = td.func<(...args: any[]) => unknown>()
  const l = makeLogger({ level: 'info', output })
  l.debug("debugmsg")
  td.verify(output(), { times: 0, ignoreExtraArgs: true })
  l.info('infomsg')
  td.verify(output({l: "info", m: "infomsg", [levelStringSym]: "info", [levelNumberSym]: infoNum}))
  l.error("errormsg")
  td.verify(output({l: "error", m: "errormsg", [levelStringSym]: "error", [levelNumberSym]: errorNum}))

  td.reset()

  l.setLevel('debug')

  l.debug("debugmsg")
  td.verify(output({l: "debug", m: "debugmsg", [levelStringSym]: "debug", [levelNumberSym]: debugNum}))
  l.info('infomsg')
  td.verify(output({l: "info", m: "infomsg", [levelStringSym]: "info", [levelNumberSym]: infoNum}))
  l.error("errormsg")
  td.verify(output({l: "error", m: "errormsg", [levelStringSym]: "error", [levelNumberSym]: errorNum}))

  td.reset()

  l.setLevel('error')

  l.debug("debugmsg")
  l.info('infomsg')
  td.verify(output(), { times: 0, ignoreExtraArgs: true })
  l.error("errormsg")
  td.verify(output({l: "error", m: "errormsg", [levelStringSym]: "error", [levelNumberSym]: errorNum}))

  t.pass()
})

test('transform works', t => {
  const transform = td.func<(o?: any) => any>()
  const output = td.func<(o?: any) => unknown>()
  const l = makeLogger({ transform, output })

  l.info("msg")
  td.verify(transform(), { times: 0, ignoreExtraArgs: true })
  td.verify(output({ l: "info", m: "msg", [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  td.reset()

  td.when(transform({ a: 1 })).thenReturn({ b: 2 })
  l.info({ a: 1 }, "msg")
  td.verify(output({ l: "info", m: "msg", b: 2, [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  td.reset()

  td.when(transform({ a: 1 })).thenThrow(new Error('oh no'))
  l.info({ a: 1 }, "msg")
  td.verify(output({ l: "info", a: 1, m: "msg", [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  t.pass()
})

test('fields work', t => {
  const output = td.func<(o?: any) => unknown>()
  const l = makeLogger({ output, fields: { a: 1 } })

  l.info("msg")
  td.verify(output({ l: "info", m: "msg", a: 1, [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  t.pass()
})

test('child fields work', t => {
  const output = td.func<(o?: any) => unknown>()
  const l = makeLogger({ output, fields: { a: 1 } })

  l.child({ b: 2 }).info("msg")
  td.verify(output({ l: "info", m: "msg", a: 1, b: 2, [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  td.reset()

  l.child({ a: 2 }).info("msg")
  td.verify(output({ l: "info", m: "msg", a: 2, [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  td.reset()

  makeLogger({ output, fields: undefined }).child({ a: 3 }).info("msg")
  td.verify(output({ l: "info", m: "msg", a: 3, [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  t.pass()
})

test('fieldTransforms work', t => {
  const output = td.func<(o?: any) => unknown>()
  const l = makeLogger({ output, fieldTransforms: { a: (v, k) => v + k } })

  l.info({ a: 'b' }, 'msg')
  td.verify(output({ l: "info", m: "msg", a: 'ba', [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  t.pass()
})


test('fieldTransforms merge with children', t => {
  const output = td.func<(o?: any) => unknown>()
  const l = makeLogger({
    output,
    fieldTransforms: {
      a: (v, k) => 'a' + v + k ,
      b: (v, k) => 'b' + v + k
    }
  })

  l.child({}, { fieldTransforms: {
    b: (v, k) => 'b2' + v + k
  } }).info({ a: '1', b: '2' }, 'msg')

  td.verify(output({ l: "info", m: "msg", a: 'a1a', b: 'b22b', [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  t.pass()
})

test('fieldTransforms handle throws gracefully', t => {
  const output = td.func<(o?: any) => unknown>()
  const l = makeLogger({
    output,
    fieldTransforms: {
      a: () => {
        throw new Error('oh no')
      }
    }
  })

  l.info({ a: 'v' }, 'msg')
  td.verify(output({ l: "info", m: "msg", a: 'v', [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  t.pass()
})

test('base works', t => {
  const output = td.func<(o?: any) => unknown>()
  let i = 0
  const l = makeLogger({
    output,
    base: () => ({ a: ++i })
  })

  l.info('foo')
  td.verify(output({ l: "info", m: "foo", a: 1, [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  l.info('foo')
  td.verify(output({ l: "info", m: "foo", a: 2, [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  t.pass()
})

test('base can throw', t => {
  const output = td.func<(o?: any) => unknown>()
  const l = makeLogger({
    output,
    base: () => { throw new Error('oh no') }
  })

  l.info('foo')
  td.verify(output({ l: "info", m: "foo", [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  t.pass()
})

test('format works', t => {
  const output = td.func<(o?: any) => unknown>()
  const l = makeLogger({
    output,
    format: (...args: any[]) => 'x:' + [...args].join(',')
  })

  l.info('foo')
  td.verify(output({ l: "info", m: "foo", [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  l.info('foo', 'bar')
  td.verify(output({ l: "info", m: "x:foo,bar", [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  l.info({ a: 1 }, 'zip', 'zap')
  td.verify(output({ l: "info", m: "x:zip,zap", a: 1, [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  t.pass()
})

test('format can throw', t => {
  const output = td.func<(o?: any) => unknown>()
  const l = makeLogger({
    output,
    format: () => { throw new Error('oh no') }
  })

  l.info('foo', 'bar')
  td.verify(output({ l: "info", m: ["foo", 'bar'], [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  t.pass()
})

test('child can override most things', t => {
  const output1 = td.func<(o?: any) => unknown>()
  const transform1 = td.func<(o?: any) => any>()
  const format1 = td.func<(...o: any[]) => string>()
  const l = makeLogger({
    output: output1,
    transform: transform1,
    format: format1,
    level: 'info',
    base: () => ({ base: 1 }),
    levelOutput: 'string',
    levelKey: 'l',
    messageKey: 'm',
  })

  const output2 = td.func<(o?: any) => unknown>()
  const transform2 = td.func<(o?: any) => any>()
  const format2 = td.func<(...o: any[]) => string>()

  td.when(format2('msg', 'bar')).thenReturn('msgbar')
  td.when(transform2({ a: 1 })).thenReturn({ a: 2 })

  l.child({}, {
    output: output2,
    transform: transform2,
    format: format2,
    level: 'debug',
    base: () => ({ base: 2 }),
    levelOutput: 'number',
    levelKey: 'l2',
    messageKey: 'm2',
  })
   .debug({ a: 1 }, 'msg', 'bar')

  td.verify(output2({ l2: debugNum, m2: "msgbar", base: 2, a: 2, [levelStringSym]: "debug", [levelNumberSym]: debugNum}))
  td.verify(output1(), { times: 0, ignoreExtraArgs: true })
  td.verify(transform1(), { times: 0, ignoreExtraArgs: true })
  td.verify(format1(), { times: 0, ignoreExtraArgs: true })

  t.pass()
})

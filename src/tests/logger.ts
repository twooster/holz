import test from 'ava'
import * as td from 'testdouble'

import { LoggerOpts, Logger, BaseLogger, levelStringSym, levelNumberSym, messageSym } from '../logger'
import { redact, transform } from '../util'

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
    numericLevel: false,
    output: (_: any) => undefined,
    preprocess: (o: any) => o,
    postprocess: (o: any) => o,
    ...o
  }) as Logger<typeof testLevels>
}

test('levels work', t => {
  const output = td.func<(...args: any[]) => unknown>()
  const l = makeLogger({ level: 'info', output })
  l.debug("debugmsg")
  td.verify(output(), { times: 0, ignoreExtraArgs: true })
  l.info('infomsg')
  td.verify(output({l: "info", m: "infomsg", [levelStringSym]: "info", [levelNumberSym]: infoNum, [messageSym]: "infomsg" }))
  l.error("errormsg")
  td.verify(output({l: "error", m: "errormsg", [levelStringSym]: "error", [levelNumberSym]: errorNum, [messageSym]: "errormsg" }))

  td.reset()

  l.setLevel('debug')

  l.debug("debugmsg")
  td.verify(output({l: "debug", m: "debugmsg", [levelStringSym]: "debug", [levelNumberSym]: debugNum, [messageSym]: "debugmsg" }))
  l.info('infomsg')
  td.verify(output({l: "info", m: "infomsg", [levelStringSym]: "info", [levelNumberSym]: infoNum, [messageSym]: "infomsg" }))
  l.error("errormsg")
  td.verify(output({l: "error", m: "errormsg", [levelStringSym]: "error", [levelNumberSym]: errorNum, [messageSym]: "errormsg" }))

  td.reset()

  l.setLevel('error')

  l.debug("debugmsg")
  l.info('infomsg')
  td.verify(output(), { times: 0, ignoreExtraArgs: true })
  l.error("errormsg")
  td.verify(output({l: "error", m: "errormsg", [levelStringSym]: "error", [levelNumberSym]: errorNum, [messageSym]: "errormsg"}))

  t.pass()
})

test('transform works', t => {
  const preprocess = td.func<(o?: any) => any>()
  const output = td.func<(o?: any) => unknown>()
  const l = makeLogger({ preprocess: preprocess, output })

  l.info("msg")
  td.verify(preprocess(), { times: 0, ignoreExtraArgs: true })
  td.verify(output({ l: "info", m: "msg", [levelStringSym]: "info", [levelNumberSym]: infoNum, [messageSym]: "msg" }))

  td.reset()

  td.when(preprocess({ a: 1 })).thenReturn({ b: 2 })
  l.info("msg", { a: 1 })
  td.verify(output({ l: "info", m: "msg", b: 2, [levelStringSym]: "info", [levelNumberSym]: infoNum, [messageSym]: "msg" }))

  td.reset()

  td.when(preprocess({ a: 1 })).thenThrow(new Error('oh no'))
  l.info("msg", { a: 1 })
  td.verify(output({ l: "info", a: 1, m: "msg", [levelStringSym]: "info", [levelNumberSym]: infoNum, [messageSym]: "msg" }))

  t.pass()
})

test('fields work', t => {
  const output = td.func<(o?: any) => unknown>()
  const l = makeLogger({ output, fields: { a: 1 } })

  l.info("msg")
  td.verify(output({ l: "info", m: "msg", a: 1, [levelStringSym]: "info", [levelNumberSym]: infoNum, [messageSym]: "msg" }))

  t.pass()
})

test('child fields work', t => {
  const output = td.func<(o?: any) => unknown>()
  const l = makeLogger({ output, fields: { a: 1 } })

  l.child({ b: 2 }).info("msg")
  td.verify(output({ l: "info", m: "msg", a: 1, b: 2, [levelStringSym]: "info", [levelNumberSym]: infoNum, [messageSym]: "msg" }))

  td.reset()

  l.child({ a: 2 }).info("msg")
  td.verify(output({ l: "info", m: "msg", a: 2, [levelStringSym]: "info", [levelNumberSym]: infoNum, [messageSym]: "msg" }))

  td.reset()

  makeLogger({ output, fields: undefined }).child({ a: 3 }).info("msg")
  td.verify(output({ l: "info", m: "msg", a: 3, [levelStringSym]: "info", [levelNumberSym]: infoNum, [messageSym]: "msg" }))

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
  td.verify(output({ l: "info", m: "foo", a: 1, [levelStringSym]: "info", [levelNumberSym]: infoNum, [messageSym]: "foo" }))

  l.info('foo')
  td.verify(output({ l: "info", m: "foo", a: 2, [levelStringSym]: "info", [levelNumberSym]: infoNum, [messageSym]: "foo" }))

  t.pass()
})

test('base can throw', t => {
  const output = td.func<(o?: any) => unknown>()
  const l = makeLogger({
    output,
    base: () => { throw new Error('oh no') }
  })

  l.info('foo')
  td.verify(output({ l: "info", m: "foo", [levelStringSym]: "info", [levelNumberSym]: infoNum, [messageSym]: "foo" }))

  t.pass()
})

test('child can override most things', t => {
  const output1 = td.func<(o?: any) => unknown>()
  const preprocess1 = td.func<(o?: any) => any>()
  const l = makeLogger({
    output: output1,
    preprocess: preprocess1,
    level: 'info',
    base: () => ({ base: 1 }),
    numericLevel: false,
    levelKey: 'l',
    messageKey: 'm',
  })

  const output2 = td.func<(o?: any) => unknown>()
  const preprocess2 = td.func<(o?: any) => any>()

  td.when(preprocess2({ a: 1 })).thenReturn({ a: 2 })

  l.child({}, {
    output: output2,
    preprocess: preprocess2,
    level: 'debug',
    base: () => ({ base: 2 }),
    numericLevel: true,
    levelKey: 'l2',
    messageKey: 'm2',
  })
   .debug('msg', { a: 1 })

  td.verify(output2({ l2: debugNum, m2: "msg", base: 2, a: 2, [levelStringSym]: "debug", [levelNumberSym]: debugNum, [messageSym]: "msg" }))
  td.verify(output1(), { times: 0, ignoreExtraArgs: true })
  td.verify(preprocess1(), { times: 0, ignoreExtraArgs: true })

  t.pass()
})

test('logger with redaction', t => {
  const output1 = td.func<(o?: any) => unknown>()
  const l = makeLogger({
    output: output1,
    level: 'info',
    numericLevel: false,
    levelKey: 'l',
    messageKey: 'm',
    postprocess: transform({
      headers: {
        authorization: redact()
      }
    })
  })

  l.info('foo', { headers: { authorization: 'abc', contentType: 'application/json' }, age: 23 })

  td.verify(output1({ m: 'foo', l: 'info', headers: { authorization: '[REDACTED]', contentType: 'application/json' }, age: 23, [levelStringSym]: 'info', [levelNumberSym]: infoNum, [messageSym]: 'foo' }))

  t.pass()

})

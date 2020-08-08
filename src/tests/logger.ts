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
  td.verify(output({ l: "info", m: "msg", [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  t.pass()
})

test('fields work', t => {
  const output = td.func<(o?: any) => unknown>()
  const l = makeLogger({ output, fields: { a: 1 } })

  l.info("msg")
  td.verify(output({ l: "info", m: "msg", a: 1, [levelStringSym]: "info", [levelNumberSym]: infoNum}))

  t.pass()
})

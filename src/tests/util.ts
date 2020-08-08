import test from 'ava'
import * as td from 'testdouble'

import * as util from '../util'

test('safeStringify stringifies JSON', t => {
  t.is(util.safeStringify({a:1}), `{"a":1}`)
})

test('safeStringify handles exceptions', t => {
  const objThatThrows = {
    a: {
      toJSON() { throw new Error('foo!') }
    }
  }
  t.is(util.safeStringify(objThatThrows), '{"a":"[Throws: foo!]"}')
})

test('safeStringify handles circular deps', t => {
  const circularObj: any = { obj: {}, arr: [] }
  circularObj.obj.ref = circularObj
  circularObj.arr.push(circularObj)
  t.is(util.safeStringify(circularObj), '{"obj":{"ref":"[Circular]"},"arr":["[Circular]"]}')
})

test('jsonToStream seems to work', t => {
  const write = td.func<(o: unknown) => unknown>()
  const fakeStream = { write }

  const outputFn = util.jsonToStream(fakeStream)
  outputFn({ a: 1 })
  td.verify(write('{"a":1}\n'))
  t.pass()
})

test('transformError returns the original object when not an Error', t => {
  const o = { a: 1 }
  t.is(util.transformError(o), o)
})

test('transformError captures pertinent error information', t => {
  const err = new Error('oh no!')
  err.stack = 'stack'
  const trans = util.transformError(err)
  t.is(trans instanceof Error, false)
  t.is(trans.stack, 'stack')
  t.is(trans.message, 'oh no!')
  t.is(trans.name, 'Error')
  t.is(trans.code, undefined)
  t.is(trans.signal, undefined)
})

test('transformError captures recursive causes', t => {
  const causeCause: any = new Error('cause cause')
  causeCause.stack = 'cause-cause'
  const cause: any = new Error('cause')
  cause.stack = 'cause'
  cause.cause = () => causeCause
  const err: any = new Error('error')
  err.stack = 'error'
  err.cause = () => cause

  const trans = util.transformError(err)
  t.is(trans.stack, 'error\nCaused by: cause\nCaused by: cause-cause')
})

test('transformError handles throwing causes gracefully', t => {
  const cause: any = new Error('cause')
  cause.stack = 'cause'
  cause.cause = () => { throw new Error('Errors in errors, wow') }
  const err: any = new Error('error')
  err.stack = 'error'
  err.cause = () => cause

  const trans = util.transformError(err)
  t.is(trans.stack, 'error\nCaused by: cause')
})

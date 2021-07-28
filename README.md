![Holz Logo](./assets/holz.png "Holz")

# Holz, a fast, minimal TypeScript logger

Holz is a logging library if you want a fast, simple, JSON-to-stdout logger.

It's smaller and faster than pretty much anything out there. That's because
it doesn't do much. There's no file rotation, there's no syslog, there's
only stdout. It's assumed you have an external program handling all of
the log file management, replication, etc.

That said, it's configurable and easy to use. Enjoy.

## Motivation

There's a lot of loggers out there. Bunyan, Winston, Pino, log4js, ye old
console.log. None of them scratched my itch:

* Fast, small, simple, readable code
* TypeScript, and fully type-checked, including custom levels
* Minimal dependencies (only one: [`safe-json-stringify`](https://www.npmjs.com/package/safe-json-stringify))
* Child loggers with fields
* Customizable dynamic base objects and static base-fields
* Pre- and post-processing of log objects
* Customizable level and message attribute names
* Custom output functions
* No `v` (version), `hostname`, or `pid` fields by default; you can add them
  if you wish, but I don't need or want them. Create your own logger factory
  with `fields` set if you need 'em.
* No extra cruft: No syslog, no file rotation, no stream management. Out of the box: Just JSON to stdout.

## Use

```javascript
import { createLogger } from 'holz'

const logger = createLogger()

// Log a simple message:
logger.info('boo!')
// stdout: {"level":"info","msg":"boo!"}

// Log with a json object:
logger.info('oh hi!', { user: 'user1' })
// stdout: {"level":"info","msg":"oh hi!","user":"user1"}

// The message key will be overridden if set on the json object
logger.info('oh hi!', { user: 'user1', msg: 'will be overridden' })
// stdout: {"level":"info","msg":"oh hi!","user":"user1"}

// Create a child logger
const childLogger = logger.child({ user: 'user1' })
childLogger.warn('oh hi!', { a: 1 })
// stdout: {"level":"warn","a":1,"msg":"oh hi!"}

const errorChildLogger = logger.child({}, { level: 'error' })
errorChildLogger.info("you won't see this message")
// not logged because 'info' level is lower than 'error'

// Log an error (automatically transformed):
logger.error('there was an error', new Error('Oh no!'))
// stdout: {"level":"error","msg":"there was an error","error":{"message":"Oh no!","stack":"...",...}}
```

Simple.

### `createLogger`

Creates a logger object. Due to TypeScript constraints, you'll want to use
this function to create a logger that has the appropriate types. The
options struct looks like this, in kinda-typescript:

```javascript
type CreateLoggerOpts = {
  // A structure of level name -> level number, like { info: 20, warn: 30 }
  // if this isn't provided, it defaults to bunyan/pino standard levels
  // of { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 }
  levels: { [k: string]: number }

  // The current minimum log level
  // Optional if `levels` is not provided; defaults to 'info'
  // Required if `levels` is provided to set the default log level
  level: keyof levels | number

  // Optional: a function to generate the base payload object dynamically
  base: () => Fields

  // Optional: static base fields, will be applied on top of the dynamic object
  fields: Fields

  // Optional: Key in the payload that will receive the current log level,
  // defaults to 'level'
  levelKey: string

  // Whether the numeric or string level will be put in the key, defaults to `false`
  numericLevel: boolean

  // Key in the payload that will receive the log message; defaults to 'msg'
  messageKey: string

  // Optional: A function that will be called to format the message if there are
  // any trailing parameters after the message; otherwise, this fn will not
  // be called.
  format: (msg: string, ...args: unknown[]) => string

  // Optional: If an object is provided as the second paramter to a log
  // function, `preprocess` will be called on this object first. The return
  // value will be  merged into the logging object (partially built from `base`
  // and `fields` already).
  preprocess: (o: object) => object

  // Optional: Optionally post-process the log object before it's finalized.
  // The payload will be replaced with whatever value is returned by this
  // function. If an object isn't returned, then the log will not go through.
  postprocess: (o: object) => object | void

  // Optional: Function that outputs a log line; defaults to writing JSON to stdout
  output: (s: Payload) => void
}
```

When you call `createLogger`, you definitely want to use a literal option struct
so that you get TypeScript typechecking for the per-level methods attached to
the resulting logger. For example, this works fine:

```javascript
const logger = createLogger({
  levels: {
    info: 50,
    error: 100
  },
  level: 'info',
})
// Works fine; key retrieved from `levels` def'n
logger.info(...)
```

But this does not:

```javascript
const logOpts: any = {
  levels: {
    info: 50
  },
  level: 'info'
}
const logger = createLogger(logOpts)
// Results in a TypeScript error:
logger.info(...) // `info` not defined
```

Also, don't use the keys `child` or `setLevel` or `_log` as log levels,
because that will cause problems when the logging methods are assigned to
the logger.

### Methods on the logger

The logger has two public predefined methods on it: `child` and `setLevel`.

#### `Logger#child`

This is pretty simple, it has the signature:

```javascript
Logger#child(fields, opts)
```

Where `fields` are fields that will be applied to all messages logged
through the child. These are merged with the parent logger's fields.
`opts` is basically the same as the logger options except:

1. `fields` can't be set (because that's what `fields` argument is, silly)
1. `levels` can't be set -- they're locked in place from the parent logger
1.  There is no merging logic if you override `base`, `preprocess` or
    `postprocess`

All other fields can be set and work as expected.

#### `Logger#setLevel`

This method allows you to set the log level:

```javascript
Logger#setLevel(level: string | number)
```

If you provide a string, it had better be one of the keys of the logger's
configured `levels`, otherwise this function will go boom. If you provide a
number, that will work directly as the _minimum_ log level (all numeric values
equal or higher will be printed, all lower will not be printed).

#### The dynamic log methods

The logger sets up some dynamic logging methods based upon the `levels` you
provide. If you just want to use the default levels, the logger will have
`trace`, `debug`, `info`, `warn`, `error` and `fatal` on it.

These functions will all have the same signature:

```javascript
type LogMethod = ((msg: string, obj?: object) => void)
```

Building up the logging payload looks like this:

1. First, the payload is built from the `base`, if provided, or an empty
   object otherwise
1. If `fields` are defined, they are merged into the payload
1. If an object was passed in as the second parameter, then it is
   `preprocessed` (if used), and merged into the payload
1. The message and the level is set on the payload, according to
   `messageKey` and `levelKey`
1. If `postprocess` is set, the payload is postprocessed and replaced,
   or the log discarded if `postprocess` returns a falsy value. Postprocessing
   could remove all previously set attributes.
1. The non-enumerable symbol fields are set containing the original
   numeric and string levels (see `levelStringSym` and `levelNumberSym` exports),
   as well as the message (`messageSym`) for processing of downstream output,
   if you need.

Finally, after all of that, the message payload is passed to the `output`
function.

This whole process has a whole lot of `try`/`catch` around everything, so
it should never blow up. Since the primary purpose of logging is to get
information out of a system, the log method tries to do its best to
output the data you've provided, through all the transforms you've provided,
and will generally fall back to sane defaults if it encounters errors.

#### The defaults

A few defaults are provided out of the box. These are:

##### Default `output` function

That looks something like this:

```javascript
import safeStringify = require('safe-json-stringify')

export const defaultOutput =
  (p: Payload) => console.log(safeStringify(p))
```

If you want to use your own, you can re-import `safeStringify` from
this lib to access that dependency.

##### Default `preprocess` function

That looks like this:

```javascript
export function defaultTransform(o: object) {
  return o instanceof Error ? { error: transformError(o) } : o
}
```

`transformError` basically takes any Error instance and makes it into something
a bit more palatable to `JSON.stringify`. (It also unwinds the error `cause` if
you're using [verrors](https://github.com/joyent/node-verror).)

You can import `transformError` if you like and build your own transform
function -- like maybe detecting and formatting HTTP Request/Response objects.
Since Error logging is the only thing that is a greatest-common-denominator
across all use-cases, it's the only thing intended to be supported here.

##### Default `levels`

These follow the Bunyan/Pino defaults:

```javascript
export const defaultLevels = {
  trace: 10,
  debug: 20,
  info:  30,
  warn:  40,
  error: 50,
  fatal: 60,
} as const
```

##### Default `numericLevel`

Again, this setting determines whether numeric or string levels are output
in the field determined by the `levelKey` setting. It defaults to:

```javascript
export const defaultNumericLevel = false
```

This means that the level information is outputted as a string, e.g.,
`'info'` or `'error'`.

##### Default `levelKey`

As you might expect, the default key used on the payload output to contain
log-level information is:

```javascript
export const defaultLevelKey = 'level'
```

Another good option might be `'severity'`, but `'level'` is the default setting.


##### Default `messageKey`

What field on the payload object receives the provided message (if any):

```javascript
export const defaultMessageKey = 'msg'
```

##### Default `level`

```javascript
export const defaultLevel = defaultLevels['info']
```

The default log level is `'info'`.

##### Default `postprocess``

```javascript
export const defaultPostProcess = transform({
  err: transformError,
  error: transformError,
})
```

Again, as a greatest-common-denominator, we provide some field transforms on
`err` and `error` to help capture stack traces, etc.

### Creating your own logger factory

The easiest thing to do is to simply provide some defaults to `createLogger`.
Otherwise, to get the correct type-checking, you'll need to mix together the
`BaseLogger` class with the `LogMethods` type to get your proper type
checking. Check out how `createLogger` works to see that in action.

## I want microbenchmarks:

**Updated 2021-07-27:**

Sure ok, synchronous streaming to /dev/null, if you care about that sort of
thing:

```
          1,010,000 ops/sec > basic#holz (4.49x)
            713,000 ops/sec > basic#pino (3.16x)
            872,000 ops/sec > basic#bole (3.87x)
            282,000 ops/sec > basic#bunyan (1.25x)
            226,000 ops/sec > basic#winston (1x)

  Benches: 5
  Fastest: basic#holz
  Elapsed: 27.1s


            713,000 ops/sec > child#holz (3.76x)
            888,000 ops/sec > child#pino (4.69x)
            262,000 ops/sec > child#bunyan (1.38x)
            189,000 ops/sec > child#winston (1x)

  Benches: 4
  Fastest: child#pino
  Elapsed: 21.9s


            557,000 ops/sec > child child#holz (3.56x)
            893,000 ops/sec > child child#pino (5.71x)
            232,000 ops/sec > child child#bunyan (1.48x)
            156,000 ops/sec > child child#winston (1x)

  Benches: 4
  Fastest: child child#pino
  Elapsed: 21.9s


            516,000 ops/sec > dynamic child#holz (2.66x)
            461,000 ops/sec > dynamic child#pino (2.37x)
            194,000 ops/sec > dynamic child#bunyan (1x)
            195,000 ops/sec > dynamic child#winston (1.01x)

  Benches: 4
  Fastest: dynamic child#holz
  Elapsed: 22s


            368,000 ops/sec > dynamic child child#holz (8.74x)
             42,000 ops/sec > dynamic child child#pino (1x)
            143,000 ops/sec > dynamic child child#bunyan (3.41x)
             96,300 ops/sec > dynamic child child#winston (2.29x)

  Benches: 4
  Fastest: dynamic child child#holz
  Elapsed: 22s
```

What does it mean? What's the difference between `child` and `dynamic child`?

`child`: creates a child logger _once_, before the benchmark, and then logs to
it for each execution.

`dynamic-child`: for _each execution_, creates a child logger and then logs to
it.

I prefer to optimize for the latter case, since it represents how I suspect most
people use child-loggers: attach a bit of context (e.g., for a web request), do
a bit of logging, and then throw it away. Pino is particularly slow for this
type of logging, especially nested more than once: you pay a large cost
for instantiating a child logger, and a lower cost for each logging call.

Note that Winston has a terrible memory leak and will crash the benchmark
suites if run all together. Sadface.

const { bunyanLogger, winstonLogger, pinoLogger, holzLogger, bench } = require('./setup')

const MAX = 20

module.exports = bench([
  function benchBunyan (cb) {
    const ch = bunyanLogger.child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
      .child({ gaggle: "google", dingle: "dangle", foofy: "toofy" })
    for (let i = 0; i < MAX; ++i) {
      ch.info('hello world')
    }
    setImmediate(cb)
  },
  function benchWinston (cb) {
    const ch = winstonLogger.child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
      .child({ gaggle: "google", dingle: "dangle", foofy: "toofy" })
    for (let i = 0; i < MAX; ++i) {
      ch.log('info', 'hello world')
    }
    setImmediate(cb)
  },
  function benchPino (cb) {
    const ch = pinoLogger.child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
      .child({ gaggle: "google", dingle: "dangle", foofy: "toofy" })
    for (let i = 0; i < MAX; ++i) {
      ch.info('hello world')
    }
    setImmediate(cb)
  },
  function benchHolz (cb) {
    const ch = holzLogger.child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
      .child({ gaggle: "google", dingle: "dangle", foofy: "toofy" })
    for (let i = 0; i < MAX; ++i) {
      ch.info('hello world')
    }
    setImmediate(cb)
  }
], 10000)

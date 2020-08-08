const { bunyanLogger, winstonLogger, pinoLogger, holzLogger, bench } = require('./setup')

const MAX = 20

module.exports = bench([
  function benchBunyan (cb) {
    for (let i = 0; i < MAX; ++i) {
      bunyanLogger.child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" }).info('hello world')
    }
    setImmediate(cb)
  },
  function benchWinston (cb) {
    for (let i = 0; i < MAX; ++i) {
      winstonLogger.child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" }).log('info', 'hello world')
    }
    setImmediate(cb)
  },
  function benchPino (cb) {
    for (let i = 0; i < MAX; ++i) {
      pinoLogger.child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" }).info('hello world')
    }
    setImmediate(cb)
  },
  function benchHolz (cb) {
    for (let i = 0; i < MAX; ++i) {
      holzLogger.child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" }).info('hello world')
    }
    setImmediate(cb)
  }
], 10000)

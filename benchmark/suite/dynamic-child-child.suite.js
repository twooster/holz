const { createBunyan, createWinston, createPino, createHolz, benchIfMain } = require('./setup')

function prepare(t) {
  const bunyanLogger = createBunyan()
  const winstonLogger = createWinston()
  const pinoLogger = createPino()
  const holzLogger = createHolz()

  t.suite('dynamic child child', () => {
    t.bench('bunyan', () => {
      bunyanLogger
        .child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
        .child({ gaggle: "google", dingle: "dangle", foofy: "toofy" })
        .info('hello world')
    })

    t.bench('winston', () => {
      winstonLogger
        .child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
        .child({ gaggle: "google", dingle: "dangle", foofy: "toofy" })
        .log('info', 'hello world')
    })

    t.bench('pino', () => {
      pinoLogger
        .child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
        .child({ gaggle: "google", dingle: "dangle", foofy: "toofy" })
        .info({ msg: 'hello world' })
    })

    t.bench('holz', () => {
      holzLogger
        .child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
        .child({ gaggle: "google", dingle: "dangle", foofy: "toofy" })
        .info({ msg: 'hello world' })
    })
  })
}

module.exports = prepare

benchIfMain(module)

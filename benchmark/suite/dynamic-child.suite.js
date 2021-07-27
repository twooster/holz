const { createBunyan, createWinston, createPino, createHolz, benchIfMain } = require('./helpers')

function prepare(t) {
  const bunyanLogger = createBunyan()
  const winstonLogger = createWinston()
  const pinoLogger = createPino()
  const holzLogger = createHolz()

  t.suite('dynamic child', () => {
    t.bench('holz', () => {
      holzLogger
        .child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
        .info('hello world')
    })

    t.bench('pino', () => {
      pinoLogger
        .child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
        .info('hello world')
    })

    t.bench('bunyan', () => {
      bunyanLogger
        .child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
        .info('hello world')
    })

    t.bench('winston', () => {
      winstonLogger
        .child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
        .log('info', 'hello world')
    })
  })
}

module.exports = prepare

benchIfMain(module)

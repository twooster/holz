const { createBole, createBunyan, createWinston, createPino, createHolz, benchIfMain } = require('./helpers')

function prepare(t) {
  const boleLogger = createBole()
  const bunyanLogger = createBunyan()
  const winstonLogger = createWinston()
  const pinoLogger = createPino()
  const holzLogger = createHolz()

  t.suite('basic', () => {
    t.bench('holz', () => {
      holzLogger.info({ a: 123 }, 'hello world')
    })

    t.bench('pino', () => {
      pinoLogger.info({ a: 123 }, 'hello world')
    })

    t.bench('bole', () => {
      boleLogger.info({ a: 123 }, 'hello world')
    })

    t.bench('bunyan', () => {
      bunyanLogger.info({ a: 123 }, 'hello world')
    })

    t.bench('winston', () => {
      winstonLogger.info('hello world', { a: 123 })
    })
  })
}

module.exports = prepare

benchIfMain(module)

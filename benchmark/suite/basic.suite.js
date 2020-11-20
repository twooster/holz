const { createBole, createBunyan, createWinston, createPino, createHolz, benchIfMain } = require('./setup')

function prepare(t) {
  const boleLogger = createBole()
  const bunyanLogger = createBunyan()
  const winstonLogger = createWinston()
  const pinoLogger = createPino()
  const holzLogger = createHolz()

  t.suite('basic', () => {
    t.bench('bole', () => {
      boleLogger.info('hello world')
    })

    t.bench('bunyan', () => {
      bunyanLogger.info('hello world')
    })

    t.bench('winston', () => {
      winstonLogger.log('info', 'hello world')
    })

    t.bench('pino', () => {
      pinoLogger.info({ a: 123 }, 'hello world')
    })

    t.bench('holz', () => {
      holzLogger.info({ a: 123 }, 'hello world')
    })
  })
}

module.exports = prepare

benchIfMain(module)

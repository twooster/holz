const { createBunyan, createWinston, createPino, createHolz, benchIfMain } = require('./setup')

function prepare(t) {
  const bunyanChild = createBunyan()
    .child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
    .child({ gaggle: "google", dingle: "dangle", foofy: "toofy" })
  const winstonChild = createWinston()
    .child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
    .child({ gaggle: "google", dingle: "dangle", foofy: "toofy" })
  const pinoChild = createPino()
    .child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
    .child({ gaggle: "google", dingle: "dangle", foofy: "toofy" })
  const holzChild = createHolz()
    .child({ wizzle: "wuzzle", sizzle: "sazzle", dizzle: "dazzle" })
    .child({ gaggle: "google", dingle: "dangle", foofy: "toofy" })

  t.suite('child child', () => {
    t.bench('bunyan', () => {
      bunyanChild.info('hello world')
    })

    t.bench('winston', () => {
      winstonChild.log('info', 'hello world')
    })

    t.bench('holz', () => {
      holzChild.info({ a: 123 }, 'hello world')
    })

    t.bench('pino', () => {
      pinoChild.info({ a: 123 }, 'hello world')
    })
  })
}

module.exports = prepare

benchIfMain(module)

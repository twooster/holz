const holz = require('holz')
const pino = require('pino')
const bunyan = require('bunyan')
const bole = require('bole')
const winston = require('winston')

const stream = require('stream')

const createDevNull = () => new stream.Writable({
  write(_chunk, _encoding, cb) {
    cb(null)
  },
  writev(_chunks, cb) {
    cb(null)
  }
})

exports.createBunyan = () => bunyan.createLogger({
  name: 'bench',
  streams: [{
    level: 'trace',
    stream: createDevNull()
  }]
})

exports.createPino = () => pino({ level: 'trace' }, createDevNull())

exports.createHolz = () => holz.createLogger({
  level: 'trace',
  output: holz.jsonToStream(createDevNull())
})

exports.createWinston = () => winston.createLogger({
  level: 'silly',
  format: winston.format.json(),
  transports: [
    new winston.transports.Stream({
      stream: createDevNull()
    })
  ]
})

bole.output([
  { level: 'debug', stream: createDevNull() }
])
bole.setFastTime()

exports.createBole = () => bole('test')

exports.benchIfMain = function benchIfMain(mod) {
  if (require.main === mod && typeof mod.exports === 'function') {
    const { benchmark, PrettyReporter } = require('@c4312/matcha')
    benchmark({
      reporter: new PrettyReporter(process.stdout),
      prepare: mod.exports
    })
  }
}

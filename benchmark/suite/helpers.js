const holz = require('holz')
const pino = require('pino')
const bunyan = require('bunyan')
const bole = require('bole')
const winston = require('winston')

const stream = require('stream')

const devNull = new stream.Writable({
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
    stream: devNull
  }]
})

exports.createPino = () => pino({ level: 'trace' }, devNull)

exports.createHolz = () => holz.createLogger({
  level: 'trace',
  output: holz.jsonToStream(devNull)
})

exports.createWinston = () => winston.createLogger({
  level: 'silly',
  format: winston.format.json(),
  transports: [
    new winston.transports.Stream({
      stream: devNull
    })
  ]
})

bole.output([
  { level: 'debug', stream: devNull }
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

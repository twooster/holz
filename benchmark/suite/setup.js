const fs = require('fs')
const fastbench = require('fastbench')

const holz = require('holz')
const pino = require('pino')
const bunyan = require('bunyan')
const bole = require('bole')
const winston = require('winston')

const devNull = fs.createWriteStream('/dev/null')

exports.bunyanLogger = bunyan.createLogger({
  name: 'bench',
  streams: [{
    level: 'trace',
    stream: devNull
  }]
})

exports.pinoLogger = pino({ level: 'trace' }, devNull)

exports.holzLogger = holz.createLogger({
  level: 'trace',
  output: holz.toStream(devNull)
})

exports.winstonLogger = winston.createLogger({
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

exports.boleLogger = bole('test')

exports.bench = (...args) => {
  const run = fastbench(...args)
  return async (n = 1) => {
    for (let i = 0; i < n; ++i) {
      await new Promise(resolve => run(resolve))
    }
  }
}

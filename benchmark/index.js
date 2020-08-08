const basicSuite = require('./suite/basic.suite')
const childSuite = require('./suite/child.suite')
const dynamicChildSuite = require('./suite/dynamic-child.suite')

;(async () => {
  console.log('Basic suite:')
  await basicSuite(2)
  console.log('\nChild logger suite:')
  await childSuite(2)
  console.log('\nDynamic child logger suite:')
  await dynamicChildSuite(2)
})()

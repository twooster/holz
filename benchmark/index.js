const program = require('commander')
const { benchmark, PrettyReporter, grepMiddleware } = require('@c4312/matcha')
const { cpuProfiler } = require('@c4312/matcha/dist/middleware/cpu-profiler')
const { writeFile } = require('fs');

const suites = [
  require('./suite/basic.suite'),
  require('./suite/child.suite'),
  require('./suite/child-child.suite'),
  require('./suite/dynamic-child.suite'),
  require('./suite/dynamic-child-child.suite'),
]

const args = program
  .name('benchmark-holz')
  .option('-g, --grep <pattern>', 'Run a subset of benchmarks', '')
  .option(
    '--cpu-profile [pattern]',
    'Run on all tests, or those matching the regex. Saves a .cpuprofile file that can be opened in the Chrome devtools.',
  )
  .parse(process.argv)
  .opts()


async function main() {
  const middleware = [];
  if (args.grep) {
    middleware.push(grepMiddleware(new RegExp(args.grep, 'i')));
  }

  if (args.cpuProfile === true) {
    middleware.push(cpuProfiler(writeProfile));
  } else if (args.cpuProfile) {
    middleware.push(cpuProfiler(writeProfile, new RegExp(args.cpuProfile, 'i')));
  }


  for (const prepare of suites) {
    const reporter = new PrettyReporter(process.stdout)
    await benchmark({
      middleware,
      reporter,
      prepare,
    });
    if (global.gc) {
      global.gc();
    }
  }

}

function writeProfile(bench, profile) {
  const safeName = bench.name.replace(/[^a-z0-9]/gi, '-');
  return new Promise((resolve, reject) =>
    writeFile(`${safeName}.cpuprofile`, JSON.stringify(profile), (err, value) => {
      err ? reject(err) : resolve(value)
    })
  )
}

main()

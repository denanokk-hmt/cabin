const log = require('./logger').logger.child({label: 'shutdown-hook'});
// shutdown hook

const hooks = [];

// hook must be [async] function.
function registerShutdownHook(hook) {
  hooks.push(hook);
}

async function exitApp(end_status=0) {
  log.info('exitApp(): call hooks');
  for (const hook of hooks) {
    try {
      await hook();
    } catch (error) {
      log.error('hook throws an error.', error);
    }
  }
  log.info(`exit with ${end_status}`);
  process.exit(end_status);
}

process.on('SIGINT', ()=> exitApp(1));
process.on('SIGTERM', ()=> exitApp(1));

module.exports = {
  registerShutdownHook,
  exitApp,
}

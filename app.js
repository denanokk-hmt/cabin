const express = require('express');
const app = express();
const http = require('http');

const log = require('./logger').logger.child({label: 'app'});

async function initApp() {

  //Get config
  const { env, configs } = await require('./config').configuration();
  const { SocketServer } = require('./services/socket-server');
  const { CabinManager } = require('./services/cabin');
  const { exitApp, registerShutdownHook } = require('./shutdown-hook');

  if (configs.length === 0) {
    console.error("config is empty")
    process.exit(1);
  }

  (async() => {
    const server = http.createServer(app);

    try {
      // start CabinManager
      const cm = new CabinManager();
      await cm.start(env, configs);
      registerShutdownHook(async()=>{
        await cm.stop();
      });

      // start socket server
      const socket_server = new SocketServer();
      await socket_server.start(server, cm);

      const { public_router } = require('./routers');
      app.use('/', public_router);

      server.listen(env.port, () => {
        log.info("Cabin at http://localhost:" + env.port);
      });
    } catch (error) {
      log.error('fatal error.', error);
      await exitApp(1);
    }
  })();
}
initApp();

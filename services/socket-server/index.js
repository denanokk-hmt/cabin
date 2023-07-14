const io = require('socket.io');
const log = require('../../logger').logger.child({label: 'SocketServer'});

class SocketServer {

  async start(http_server, cabin_manager) {
    this.cabin_manager = cabin_manager;

    this.server = io(http_server, {
      path: '/cabin/connect',
      cookie: 'hmt-io',
      cookiePath: false,
    });

    this.server.use(async(socket, next) => await cabin_manager.authenticateSocket(socket, next));

    this.server.on('connection', (socket)=> {
      cabin_manager.addSocket(socket);
    });

    log.info('started');
  }
}

module.exports = {
  SocketServer,
};

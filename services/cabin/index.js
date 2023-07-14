const log = require('../../logger').logger.child({label: 'cabin-manager'});
const { CabinService } = require('./cabin-service');


class CabinManager {
  constructor() {
    this.cabins = {};
  }

  async start(env, configs) {
    let e = null;

    for (const c of configs) {
      const cs = new CabinService();
      try {
        await cs.start(env, c);
      } catch (error) {
        e = error;
        break;
      }
      this.cabins[c.client_id] = cs;
    }

    if (e) {
      // stop all cabin service
      for (const client_id in this.cabins) {
        const cs = this.cabins[client_id];
        try {
          await cs.stop();
        } catch (error) {
          log.error("stop() failed.", error);
        }
      }
      throw e;
    }
  }

  async stop() {
    log.info("stopping CabinManager...");

    const promises = [];

    for (const client_id in this.cabins) {
      const cs = this.cabins[client_id];
      promises.push(cs.stop());
    }

    for (const p of promises) {
      try {
        await p;
      } catch (error) {
        log.error("stop() failed.", error);
      }
    }
    this.cabins = {};
  }

  async authenticateSocket(socket, next) {
    const { client_id, token } = socket.handshake.query;
    log.info(`handshake: client_id=${client_id}`);

    if (!this.cabins[client_id]) {
      log.info(`Invalid client_id: ${client_id} . ignore connection`);
      socket.disconnect(true);
      return next(new Error(`Bad client_id: ${client_id}`));
    }
    const cs = this.cabins[client_id];
    const session = await cs.getSession(token);
    if (session === null) {
      log.info(`Invalid token for client: ${client_id} . ignore connection`);
      return next(new Error(`Bad token: ${token}`));
    }

    socket.hmt = {
      client_id,
      token,
      session,
    };
    return next();
  }

  /*
   * handle new socket
   */
  async addSocket(socket) {
    const { client_id, token } = socket.hmt;
    const cs = this.cabins[client_id];
    await cs.addSocket(socket);
  }
}

module.exports = {
  CabinManager,
  CabinService,
}


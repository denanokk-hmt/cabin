const { logger } = require('../logger');
const { withTimeout, TimeoutError } = require('../util/timer');

function send(socket, data) {
  return new Promise((resolve, reject)=>{
  });
}

class CockpitHandler {

  start(token, socket, room_id, cabin_service) {
    this.log = logger.child({ label: `cockpit-handler(${room_id})` });

    this.token = token;
    this.socket = socket;
    this.room_id = room_id;
    this.disconnected = false;
    this.mqueue = []; // pending messages

    socket.on('message', (data, ack) => this._handleMessage(data, ack));

    socket.on('disconnect', () => {
      this.disconnected = true;
      cabin_service.removeSocket(this, room_id);
      this.log.info('socket disconnected');
    });

    this.log.info('started');
  }

  getToken() {
    return this.token;
  }

  async queueMessage(event_name, data) {
    if (this.disconnected) {
      this.log.info("socket already disconnected. ignore sendMessage()");
      return;
    }

    this.mqueue.push({ event_name, data });
    if (this.mqueue.length !== 1) {
      // another event sending messages.
      return;
    }

    while (this.mqueue.length !== 0) {
      this.log.info(`send a message to cockpit. remaining=${this.mqueue.length}`);

      const m = this.mqueue[0];
      try {
        this.log.info(`emit(${this.mqueue[0].event_name}).`);
        this.socket.emit(this.mqueue[0].event_name, this.mqueue[0].data);
      } catch (error) {
        // I don't know whether socket.send() throws error or not.
        // TODO register socket.on('error) handler.
        this.log.error("socket.send() failed", error);
        this.close();
        break;
      }
      this.mqueue.shift();
    }
  }

  close() {
    if (!this.disconnected && this.socket) {
      try {
        this.socket.disconnect(true);
      } catch (error) {
        this.log.error("socket.disconnect() failed");
      }
    }
  }

  _handleMessage(data, ack) {
    ack({ code: 'OK' });
  }
}

module.exports = {
  CockpitHandler,
};

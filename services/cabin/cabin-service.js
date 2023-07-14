const { logger } = require('../../logger');
const { CockpitHandler } = require('../../modules/cockpit-handler');
const { Subscriber } = require('../../modules/pubsub');
const { Publisher } = require('../../modules/publisher');
const { KvsClient } = require('../../modules/kvs');

/*
 * controll events from sockets and topic.
 */
class CabinService {
  constructor() {
    this.sockets = {};
    this.kvs = null;
  }

  async start(env, config) {
    this.config = config;
    this.client_id = config.client_id;

    this.log = logger.child({label: `CabinService(${this.client_id})`});

    this.log.info('starting', config);

    // create KvsClient instance
    this.kvs = new KvsClient(this.client_id);

    // start Subscriber
    this.subscriber = new Subscriber({
      cabin_service: this,
      topic_name: `cabin_${config.client_id}_${env.environment}`,
    });
    try {
      await this.subscriber.start();
    } catch (error) {
      this.log.error("sbuscriber.start() failed");
      throw error;
    }

    // create Publisher
    const keel_suffix = config.subscription_suffix ? `_${config.subscription_suffix}` : '';
    this.publisher = new Publisher({
      topic_name: `keel_${config.client_id}_${env.environment}${keel_suffix}`,
      namespace: `WhatYa-${config.client_id}-${env.environment}`,
      client_id: config.client_id,
    });

    this.log.info("started");
  }

  async stop() {
    if (this.subscriber) {
      await this.subscriber.stop();
      this.subscriber = null;
    }
  }

  /**
   * get session specified by token.
   */
  async getSession(token) {
    /*
     * returned value is set as socket.hmt.session, which will be used
     * in addSocket(socket) function below.
     */
    try {
      const session = await this.kvs.getSessionFromToken(token);
      this.log.info(`session found. rid=${session.rid}`);
      return session;
    } catch (error) {
      this.log.error(`kvs.getSessionFromToken(${token}) failed.`, error);
      return null;
    }
  }

  /*
   * handle new connection from cockpit
   */
  async addSocket(socket) {
    const { token, session } = socket.hmt;
    const room_id = session.rid;

    if (! this.sockets[room_id]) {
      this.sockets[room_id] = [];
    }
    const room_sockets = this.sockets[room_id];

    const handler = new CockpitHandler();
    room_sockets.push(handler);

    handler.start(token, socket, room_id, this);
    this.log.info(`added socket. room_id=${room_id} #${room_sockets.length}`);
  }

  /*
   * remove socket
   */
  removeSocket(cockpit_handler, room_id) {
    const room_sockets = this.sockets[room_id];
    if (!room_sockets) {
      this.log.warn(`cockpit handler not found for room_id: ${room_id}`);
      return;
    }

    this.sockets[room_id] = room_sockets.filter(item => item !== cockpit_handler);

    if (this.sockets[room_id].length === 0) {
      this.publisher.publishDisconnected(cockpit_handler.getToken());
    }
  }

  /*
   * handle message from topic.
   */
  async onMessageFromTopic(data) {
    try {
      const room_id = data.rid;

      if (!this.sockets[room_id]) {
        this.log.info(`socket for room_id(${room_id}) not exists. skip`);
        return;
      }

      let data_to_send;
      let event_name;

      // retrieve a message from KVS
      if (data.kind === 'Message') {
        const m = await this.kvs.getMessage(data.id);
        this.log.info(`message: ${JSON.stringify(m)}`);
        if (!m.talk) {
          this.log.warn(`message(${data.id}) has no talk. skip.`);
          return;
        }
        m.talk = JSON.parse(m.talk);
        data_to_send = m;
        event_name = 'message';
      } else if (data.status_code && data.messages) {
        data_to_send = data;
        event_name = 'multi_message';
      } else {
        this.log.warn(`Unknown data: ${JSON.stringify(data)}`);
        return;
      }

      // send a message
      for (const s of this.sockets[room_id]) {
        this.sendMessage(s, room_id, event_name, data_to_send);
      }
    } catch (error) {
      this.log.error(`Error: ${error}`);
    }
  }

  /*
   * send a message to socket.
   */
  async sendMessage(socket, room_id, event_name, data) {
    socket.queueMessage(event_name, data);
  }
}

module.exports = {
  CabinService,
}

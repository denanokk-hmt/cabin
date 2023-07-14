
const { logger } = require('../logger');

const { PubSub } = require('@google-cloud/pubsub');

class Publisher {

  constructor({topic_name, namespace, client_id}) {
    this.log = logger.child({ label: `publisher(${topic_name})`});

    this.client = new PubSub();
    this.topic_name = topic_name;
    this.namespace = namespace;
    this.client_id = client_id;
  }

  async publishDisconnected(token) {
    const data = JSON.stringify({
      exec: 'send_msg_2op_disconnect',
      namespace: this.namespace,
      message: 'disconnected',
      sessionId: token,
      client: this.client_id,
    });

    this.log.info(`publishDisconnected: ${data}`);
    try {
      await this.#publish(Buffer.from(data));
      //await this.publish(Buffer.from(data)); -->強引に10系でDebugさせました
    } catch (err) {
      this.log.error('publish failed', err);
    }
  }

  #publish = async(dataBuffer) => {
  //async publish(dataBuffer) { -->強引に10系でDebugさせました
    const messageId = await this.client.topic(this.topic_name).publish(dataBuffer);
    this.log.info(`message published. id=${messageId}`);
  }
}

module.exports = {
  Publisher,
}

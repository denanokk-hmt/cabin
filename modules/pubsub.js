const { logger } = require('../logger');

const { v4: uuidv4 } = require('uuid');
const { PubSub } = require('@google-cloud/pubsub');

/**
 * 現在の日時を文字列で返す
 * YYYYMMDDHHMMSS
 */
function currentDate() {
  const now = new Date();
  let str = `${now.getFullYear()}`;

  if (now.getMonth() < 9) {
    str += '0'
  }
  str += now.getMonth() + 1;

  if (now.getDate() < 10) {
    str += '0';
  }
  str += now.getDate();

  if (now.getHours() < 10) {
    str += '0';
  }
  str += now.getHours();

  if (now.getMinutes() < 10) {
    str += '0';
  }
  str += now.getMinutes();

  if (now.getSeconds() < 10) {
    str += '0';
  }
  str += now.getSeconds();

  return str;
}

class Subscriber {

  constructor({cabin_service, topic_name}) {
    this.log = logger.child({ label: `subscriber(${topic_name})`});

    this.cabin_service = cabin_service;
    this.topic_name = topic_name;
    this.client = new PubSub();

    this.started = false;

    this.subscription = null;
    this.messageHandler = (message) => this.handleMessage(message);
    this.errorHandler = (error) => this.handleError(error);
  }

  async start() {
    if (this.started) {
      throw new Error("already started");
    }

    // create unique subscription
    await this._createSubscription();

    const s = await this.client.subscription(this.subsc_name);

    s.on('error', this.errorHandler);
    s.on('message', this.messageHandler);

    this.log.info('subscriber started.');

    this.subscription = s;
    this.started = true;
  }

  async handleMessage(message) {
    message.ack();

    const data = JSON.parse(message.data);
    this.log.info(`message received: '${message.data}'`);

    this.cabin_service.onMessageFromTopic(data);
  }

  async handleError(error) {
    this.log.error("error happened", error);
  }

  async stop() {
    if (!this.started) {
      return;
    }
    this.subscription.removeListener('message', this.messageHandler);
    this.subscription.removeListener('error', this.errorHandler);
    this.log.info('listener removed');

    await this.subscription.close();

    await this._deleteSubscription();

    this.started = false;
    this.log.info("stopped");
  }

  async _createSubscription() {
    this.subsc_name = `${this.topic_name}-${currentDate()}-${uuidv4()}`

    this.log.info(`creating subscription for topic: ${this.topic_name}`);

    await this.client.topic(this.topic_name).createSubscription(
        this.subsc_name,
        {
          expirationPolicy: { ttl: null }
        });

    this.log.info(`Subscription created: ${this.subsc_name}`);
  }

  async _deleteSubscription() {
    await this.client.subscription(this.subsc_name).delete();

    this.log.info(`Subscription deleted: ${this.subsc_name}`);
  }
}

module.exports = {
  Subscriber,
}

const { logger } = require('../../../logger');

const { Datastore } = require('@google-cloud/datastore');
const { KIND } = require('./config');
const { env } = require('../../../config/config_exports')

const { getSession, getSessionFromToken, } = require('./session');

class DsClient {

  constructor(client_id) {
    //Set datastore namespace
    const namespace = `${env.service}-${client_id}-${env.environment}`;
    this.datastore = new Datastore({
      namespace,
    });

    this.log = logger.child({label: `DsClient(${namespace})`});

    this.log.info(`created DsClient. namespace=${namespace}`);
  }

  async putEntity(entity) {
    try {
      await datastore.save(entity);
      return entity;
    } catch (error) {
      this.log.error(`Error: putEntity(...)`, error);
      throw error;
    }
  }

  async updateEntity(entity) {
    try {
      await this.datastore.update(entity);
      return entity;
    } catch (error) {
      this.log.error(`Error: updateEntity(...)`, error);
      throw error;
    }
  };

  async deleteEntity(key) {
    try {
      await this.datastore.delete(key);
    } catch (error) {
      this.log.error(`Error: deleteEntity(${key})`, error);
      throw error;
    }
  }

  async getByAncestorKey(pKind, key, cKind) {

    const ancestorKey = this.datastore.key([ pKind, key, ])

    const query = this.datastore.createQuery(cKind).hasAncestor(ancestorKey);

    try {
      const results = datastore.runQuery(query);
      return entities[0];
    } catch(error) {
      this.log.error(`Error: getByAncestorKey(${pKind}, ${key}, ${cKind})`, error);
      throw error;
    }
  }

  async getEntityByKey(kind, key, customNm=true) {

    const key_val = (customNm)? String(key) : Number(key)

    const query = this.datastore
      .createQuery(kind)
      .filter('__key__', '=', this.datastore.key([kind, key_val]));
    
    try {
      const values = await this.datastore.runQuery(query);
      const entity = values[0];
      return entity.length === 0 ? null : entity[0];
    } catch (error) {
      this.log.error(`Error: getEntityByKey(${kind}, ${key}, ${key_val})`, error);
      throw error;
    }
  }
}

class KvsClient {

  #ds;

  constructor(client_id) {
    this.client_id = client_id;
    this.#ds = new DsClient(client_id);
    //this.ds = new DsClient(client_id);-->強引に10系でDebugさせました
  }

  async getSessionFromToken(token) {
    return await getSessionFromToken(this.#ds, token);
    //return await getSessionFromToken(this.ds, token);-->強引に10系でDebugさせました
  }

  async getSession(sid) {
    return await getSession(this.#ds, sid);
    //return await getSession(this.ds, sid);-->強引に10系でDebugさせました
  }

  async getMessage(mid) {
    return await this.#ds.getEntityByKey(KIND.MESSAGE, mid, false);
    //return await this.ds.getEntityByKey(KIND.MESSAGE, mid, false);-->強引に10系でDebugさせました
  }

}

module.exports = {
  KvsClient,
};

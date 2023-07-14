const { env } = require('../../config/config_exports')
console.log("env in kvs index", JSON.stringify(env))


let KvsClient;

if (env.cloud_platform === 'gcp') {
  KvsClient = require('./datastore').KvsClient;
} else {
  throw new Error(`Uknown env.type: ${env.type}`);
}


module.exports = {
  KvsClient,
};

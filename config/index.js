
require('dotenv-expand')(require('dotenv').config());
const axios = require('axios');

/*
 * build env object
 */
const configuration = async () => {

  const args = require('./root.json')

  //short sha commit id
  const sha_commit_id = process.env.SHA_COMMIT_ID || null;

  //deploy stamp
  const deploy_unixtime = process.env.DEPLOY_UNIXTIME || 0;

  //restart stamp
  const restart_unixtime = process.env.RESTART_UNIXTIME || 0;

  //Set commitid
  //restart is grater than deploy_unixtime --> Restart, using latest revisions :: [sha_commit_id]_[restart_unixtime]
  //Other than that --> Deploy or Restart, using history revisions :: [sha_commit_id]
  const commitid =(deploy_unixtime < restart_unixtime)? `${sha_commit_id}_${restart_unixtime}` : sha_commit_id;

  /////////////////////////
  //Get configure by control tower

  //Set control tower credentials
  const run_domain = 'control-tower2.bwing.app';
  const run_version = '2.0.0';
  const run_token = require('./keel_auth.json').token;
  const domain = (process.env.NODE_ENV == 'prd')? `https://${run_domain}` : `http://localhost:8081`;
  const url = `${domain}/hmt/get/configuration`;

  //Get configure
  const res = await axios({
    method: 'GET',
    url: url,
    params: {
      appli_name: args.appli_name,
      version: run_version,
      token: run_token,
      server_code : args.server_code,
      environment: args.environment,
      hostname: process.env.HOSTNAME,
      commitid: commitid,
      component_version: process.env.VERSION || ((args.series=='v2')? '2.0.0' : '1.1.0'),
    },
  })
  .catch(err => {
    throw new Error(err)
  })
  const data = res.data;
  if (data.status_code !== 0) {
    throw new Error(`CT returned non-zero status_code(${data.status_code}).`);
  }

  // formation に入っている subscription_suffix を使うための準備
  const formation_map = {};
  for (const item of data.formation) {
    formation_map[item.client] = item;
  }

  let env = res.data.env;
  let configs = [];
  for (let idx in res.data.tokens_client.list) {
    configs.push( {
      client_id : idx,
      subscription_suffix: formation_map[idx]?.subscription_suffix || null,
    })
  }

  console.log('env', JSON.stringify(env));
  console.log('configs', JSON.stringify(configs));

  await require('./config_exports').init({env, configs, data})

  return { env, configs }
}

/*
 * build configs object
 */

module.exports = {
  configuration,
};

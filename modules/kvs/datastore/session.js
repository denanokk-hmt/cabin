const log = require('../../../logger').logger.child({label:'session'});

const crypto = require(`../../crypto`);
const ds_conf = require('./config')

async function getSession(ds, sid) {
  
  let session
  try {
    //Get session 
    session = await ds.getEntityByKey(ds_conf.KIND.SESSION, sid)

    //No session
    if (!session) {
      throw new Error(`no session found for ${sid}`)
    }

    //dflg
    if (session.dflg) {
      throw new Error(`session deleted: ${sid}`)
    }

  } catch(err) {
    throw err
  }

  //Entity set for update
  //put entity
  return {
    rid: session.rid,
    uid: session.uid,
    op_system: session.op_system,
    op_room_id: session.op_room_id,
    op_uuid: session.op_uuid,
    op_access_token: session.op_access_token,
  };
}

async function getSessionFromToken(ds, token) {
  
  let seed, encrypt, session
  try {

    const hashIdPw = crypto.decrypt(token).crypt.slice(8,);
      
    //Get Seed
    const seeds = await ds.getEntityByKey(ds_conf.KIND.SEED, hashIdPw);
    seed = (seeds)? seeds.seed : ''
      
    //Encrypt
    const crypted = crypto.encrypt(`${seed}${hashIdPw}`)
    if (!crypted.issue) {
      return crypted
    }
    encrypt = crypted.crypt;
    log.info(`sid from token: ${encrypt}`);

    //Get session 
    return await getSession(ds, encrypt);

  } catch(err) {
    throw err
  }
}

module.exports = {
  getSession,
  getSessionFromToken,
};

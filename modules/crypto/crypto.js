'use strict';
const crypto = require('crypto');

/**
 * Hash mac
 * @param {*} id 
 * @param {*} pw 
 */
const hashMac = (id, pw) => {

  //////////////////////////////////////////////////////
  //Sampler
  //  const client = req.query.client.replace(/\r?\n/g,"");
  //  const secret = `${client}${Math.floor(Math.random()*Math.floor(100000))}`;
  //  const text = crypto.randomBytes(8).toString('hex');
  //////////////////////////////////////////////////////
  try {
    const secret = String(id);
    const text = String(pw);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.write(text); // write in to the stream
    hmac.end();       // can't read from the stream until you call end()
    const hash = hmac.read().toString('hex'); // read out hmac digest
    return { 
      type : 'Token',
      token : `${hash}`,
      issue : true,
    };
  } catch(err) {
    throw err;
  }
};
module.exports.hashMac = hashMac;

/**
 * Make seed
 */
const seedRandom8 = () => {
  return Math.random().toString(36).slice(-8);
}
module.exports.seedRandom8 = seedRandom8;

/**
 * Encryption
 * @param {*} text 
 */
const encrypt = (text) => {
  try {
    const key = "lcllsljk"
    let cipher = crypto.createCipher("aes-256-cbc" ,key)
    let crypted = cipher.update(text,'utf8','base64')
    crypted += cipher.final('base64');
    return { 
      type : 'Token',
      crypt : crypted,
      issue : true,
    };
  } catch(err) {
    throw err;
  }
}
module.exports.encrypt = encrypt

/**
 * Decryption
 * @param {*} text 
 */
const decrypt = (text) => {
  try {
    const key = "lcllsljk"
    let decipher = crypto.createDecipher("aes-256-cbc",key);
    let dec = decipher.update(text,'base64','utf8')
    dec += decipher.final('utf8');
    return { 
      type : 'Token',
      crypt : dec,
      issue : true,
    };
  } catch(err) {
    throw err;
  }
};

module.exports.decrypt = decrypt

const log = require('../logger').logger.child({label: 'timer'});

function sleep(msec) {
  return new Promise((resolve, reject)=>{
    setTimeout(()=>{
      resolve();
    }, msec);
  });
}

class TimeoutError extends Error {
  constructor(msg) {
    super(msg);
  }
}

function withTimeout(p, msec, on_timeout=null) {
  return new Promise((resolve, reject)=>{
    let timeout = false;
    // start timer
    const timer = setTimeout(async()=>{
      if (timeout === null) {
        return; // p is already resolved or rejected.
      }
      timeout = true;
      if (on_timeout) {
        try {
          await on_timeout();
        } catch (error) {
          log.error('withTimeout(): Error thrown while executing on_timeout()');
        }
      }
      reject(new TimeoutError(`timeout`));
    }, msec);

    p.then((val) => {
      if (timeout === false) {
        clearTimeout(timer);
        resolve(val);
      }
    }).catch((error) => {
      if (timeout === false) {
        clearTimeout(timer);
        reject(error);
      }
    });
  });
}

module.exports = {
  sleep,
  withTimeout,
  TimeoutError,
};

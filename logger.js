const { createLogger, transports, format } = require('winston');
const { combine, label, timestamp, splat, printf } = format;

let level;
if (process.env.NODE_ENV === 'development') {
  level = 'trace';
} else {
  level = 'info';
}

const hostname = process.env.HOSTNAME ? process.env.HOSTNAME : 'localhost';

const log_format = printf( ({level, message, label, info})=> {
  if (!label) {
    label = 'root';
  }
  if (info) {
    return `[${hostname}][${label}] ${message} ${info}`;
  } else {
    return `[${hostname}][${label}] ${message}`;
  }
});

const logger = createLogger({
  level: 'info',
  format: combine(
    // timestamp(),
    log_format,
  ),
  transports: [
    new transports.Console()
  ],
});

module.exports = {
  logger,
};

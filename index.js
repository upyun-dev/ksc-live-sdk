const Client = require('./src/client');

module.exports = {
  Client,
};

process.on('unhandledRejection', function (reason) {
  console.log(reason); // eslint-disable-line no-console
});

process.on('uncaughtException', err => {
  console.log(err); // eslint-disable-line no-console
});

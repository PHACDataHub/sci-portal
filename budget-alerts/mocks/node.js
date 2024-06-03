const { setupServer } = require('msw/node');
const { handlers } = require('./handlers');

const { Handlers } = require('./handlers');

const server = setupServer(...Handlers);
server.listen();

module.exports = { server };

const { setupServer } = require('msw/node');

const server = setupServer();
server.listen();

module.exports = { server };

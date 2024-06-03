const { setupServer } = require('msw/node');

const server = setupServer();
server.listen();

module.exports = { server };

// process.env.GC_NOTIFY_API_KEY = 'api-key';
// process.env.GC_NOTIFY_URI = 'https://api.notification.canada.ca';
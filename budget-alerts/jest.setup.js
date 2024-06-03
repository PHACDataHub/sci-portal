const {
  describe,
  expect,
  test,
  beforeAll,
  afterEach,
  afterAll,
} = require('@jest/globals');
const { server } = require('./mocks/node');

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

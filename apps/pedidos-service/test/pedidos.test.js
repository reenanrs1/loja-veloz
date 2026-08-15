const assert = require('assert');
const test = require('node:test');
const app = require('../index');

test('GET /healthz deve retornar status UP', async () => {
  const req = { headers: {} };
  let statusCode = null;
  let jsonResponse = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(obj) {
      jsonResponse = obj;
    },
    setHeader() {}
  };

  const routeHandler = app._router.stack.find(
    s => s.route && s.route.path === '/healthz' && s.route.methods.get
  ).route.stack[0].handle;

  await routeHandler(req, res);

  assert.strictEqual(statusCode, 200);
  assert.strictEqual(jsonResponse.status, 'UP');
});

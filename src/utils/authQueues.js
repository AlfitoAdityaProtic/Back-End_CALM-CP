const { createRequestQueue } = require("./requestQueue");

const registerQueue = createRequestQueue({
  concurrency: 10,
  maxQueue: 100,
});

const loginQueue = createRequestQueue({
  concurrency: 20,
  maxQueue: 200,
});

module.exports = {
  registerQueue,
  loginQueue,
};
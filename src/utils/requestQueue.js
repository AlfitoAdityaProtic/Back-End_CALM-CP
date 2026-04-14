function createRequestQueue({ concurrency = 10, maxQueue = 50 } = {}) {
  let activeCount = 0;
  const queue = [];

  const runNext = () => {
    if (activeCount >= concurrency) return;
    if (queue.length === 0) return;

    const item = queue.shift();
    activeCount++;

    item.fn()
      .then(item.resolve)
      .catch(item.reject)
      .finally(() => {
        activeCount--;
        runNext();
      });
  };

  const enqueue = (fn) =>
    new Promise((resolve, reject) => {
      if (queue.length >= maxQueue) {
        return reject(new Error("AUTH_QUEUE_FULL"));
      }

      queue.push({ fn, resolve, reject });
      runNext();
    });

  return {
    enqueue,
    getStats: () => ({
      activeCount,
      queuedCount: queue.length,
      concurrency,
      maxQueue,
    }),
  };
}

module.exports = { createRequestQueue };
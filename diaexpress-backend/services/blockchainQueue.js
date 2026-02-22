const queue = [];
let isProcessing = false;

async function processNext() {
  if (!queue.length) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const job = queue.shift();

  try {
    await job.handler(job.payload);
  } catch (error) {
    console.error('[blockchainQueue] Job failed', error);
  } finally {
    setImmediate(processNext);
  }
}

function enqueue(handler, payload) {
  queue.push({ handler, payload });
  if (!isProcessing) {
    processNext();
  }
}

module.exports = {
  enqueue,
};

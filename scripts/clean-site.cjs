const fs = require("fs");

const target = "_site";
const maxAttempts = 20;
const retryableCodes = new Set(["EBUSY", "ENOTEMPTY", "EPERM"]);

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

if (!fs.existsSync(target)) {
  process.exit(0);
}

let lastError;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    fs.rmSync(target, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100
    });
    process.exit(0);
  } catch (error) {
    lastError = error;

    if (!retryableCodes.has(error.code) || attempt === maxAttempts) {
      throw error;
    }

    sleep(250);
  }
}

throw lastError;

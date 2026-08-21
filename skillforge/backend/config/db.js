const mongoose = require('mongoose');

let hasConnectedOnce = false;

async function connectDB(mongoUri, { retries = 5, retryDelayMs = 3000 } = {}) {
  mongoose.set('strictQuery', true);

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 8000,
      });
      hasConnectedOnce = true;
      console.log(`[db] Connected to MongoDB (attempt ${attempt}/${retries}).`);
      return mongoose.connection;
    } catch (err) {
      console.error(`[db] MongoDB connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) {
        console.error('[db] Exhausted MongoDB connection retries. Server will continue starting in degraded mode.');
        return null;
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
  return null;
}

mongoose.connection.on('disconnected', () => {
  if (hasConnectedOnce) {
    console.warn('[db] MongoDB disconnected. Some endpoints may fail until reconnection.');
  }
});

mongoose.connection.on('reconnected', () => {
  console.log('[db] MongoDB reconnected.');
});

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('[db] MongoDB connection closed gracefully.');
  }
}

module.exports = { connectDB, disconnectDB, isDbConnected };

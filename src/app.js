const http = require('http');

const configs = require('./commons/configs');
const app = require('./loaders/express');
const mqttLoader = require('./loaders/mqtt');
const firebaseLoader = require('./loaders/firebase');
const socketIOLoader = require('./loaders/socketio');
const logger = require('./loaders/winston');
const cronJobsLoader = require('./loaders/cronjob');

const server = http.createServer(app);

const PORT = configs.PORT;

async function bootstrap() {
  try {
    firebaseLoader();
    mqttLoader();
    cronJobsLoader();

    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
    socketIOLoader(server);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

bootstrap();

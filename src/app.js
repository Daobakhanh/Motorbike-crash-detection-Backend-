const http = require('http');

const configs = require('./commons/configs');
const app = require('./loaders/express');
const mqttLoader = require('./loaders/mqtt');
const firebaseLoader = require('./loaders/firebase');
const socketIOLoader = require('./loaders/socketio');

const server = http.createServer(app);

const PORT = configs.PORT;

async function bootstrap() {
  try {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    mqttLoader();

    firebaseLoader();

    socketIOLoader(server);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

bootstrap();

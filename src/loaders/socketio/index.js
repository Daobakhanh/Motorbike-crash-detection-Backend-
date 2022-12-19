const { Server } = require('socket.io');
const { Container } = require('typedi');

const { DI_KEYS } = require('../../commons/constants');
const registerDeviceHandler = require('./device.handler');

module.exports = function socketIOLoader(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });
  Container.set(DI_KEYS.SOCKETIO, io);
  console.log('Socket.io loaded');

  io.use((socket, next) => {
    const { accessToken } = socket.handshake.auth;
    const fbAuth = Container.get(DI_KEYS.FB_AUTH);

    if (!accessToken) {
      return next(new Error('Authentication error'));
    } else {
      fbAuth
        .verifyIdToken(accessToken)
        .then(decodedToken => {
          socket.data.userId = decodedToken.uid;
          return next();
        })
        .catch(error => {
          console.log(error);
          return next(new Error('Authentication error'));
        });
    }
  });

  io.on('connection', function (socket) {
    console.log('A new Socket.io client connected');

    registerDeviceHandler(io, socket);
  });

  io.on('error', function (error) {
    console.log(error);
  });
};

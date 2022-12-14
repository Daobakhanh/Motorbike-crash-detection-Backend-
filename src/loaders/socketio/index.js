const { Server } = require('socket.io');
const { Container } = require('typedi');
const jwt = require('jsonwebtoken');

const configs = require('../../commons/configs');
const registerDeviceHandler = require('./device.handler');

module.exports = function socketIOLoader(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });
  Container.set('socketio', io);
  console.log('Socket.io loaded');

  io.use((socket, next) => {
    const { accessToken } = socket.handshake.auth;
    if (!accessToken) {
      return next(new Error('Authentication error'));
    } else {
      jwt.verify(accessToken, configs.JWT_SECRET, (err, decoded) => {
        if (err) {
          return next(new Error('Authentication error'));
        } else {
          socket.data.userId = decoded.userId;
          return next();
        }
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

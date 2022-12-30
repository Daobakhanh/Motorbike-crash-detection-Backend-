const { Server } = require('socket.io');
const { Container } = require('typedi');

const { DI_KEYS } = require('../../commons/constants');
const AuthService = require('../../modules/auth/auth.service');
const registerLocationHandler = require('./location.handler');

module.exports = function socketIOLoader(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });
  Container.set(DI_KEYS.SOCKETIO, io);
  console.log('Socket.io loaded');

  io.use(async (socket, next) => {
    const { accessToken } = socket.handshake.query;
    const authService = new AuthService();

    if (!accessToken) {
      return next(new Error('Authentication error'));
    } else {
      const user = await authService.verifyAccessToken(accessToken);
      if (!user) {
        return next(new Error('Authentication error'));
      } else {
        socket.user = user;
        return next();
      }
    }
  });

  io.on('connection', function (socket) {
    console.log('A new Socket.io client connected');

    socket.join(socket.user.id);

    registerLocationHandler(io, socket);
  });

  io.on('error', function (error) {
    console.log(error);
  });
};

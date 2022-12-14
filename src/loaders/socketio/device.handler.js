// eslint-disable-next-line no-unused-vars
const { Server, Socket } = require('socket.io');
const { Container } = require('typedi');

const configs = require('../../commons/configs');

/**
 * @param {Server} io
 * @param {Socket} socket
 */
module.exports = (io, socket) => {
  /**
   * @type {require('mqtt').Client}
   */
  const mqttClient = Container.get('mqttClient');

  const update = async device => {};

  socket.on('device:update', update);
};

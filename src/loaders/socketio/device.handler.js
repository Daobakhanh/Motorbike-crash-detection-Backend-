const { Container } = require('typedi');
const { DI_KEYS } = require('../../commons/constants');
// const configs = require('../../commons/configs');

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
module.exports = (io, socket) => {
  /**
   * @type {import('mqtt').Client}
   */
  const mqttClient = Container.get(DI_KEYS.MQTT_CLIENT);
};

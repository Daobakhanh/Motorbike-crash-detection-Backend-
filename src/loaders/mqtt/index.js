const mqtt = require('mqtt');
const { Container } = require('typedi');

const configs = require('../../commons/configs');
const { DI_KEYS } = require('../../commons/constants');
const DeviceService = require('../../modules/devices/device.service');

module.exports = function mqttLoader() {
  const mqttClient = mqtt.connect(configs.MQTT_HOST, {
    port: configs.MQTT_PORT,
    username: configs.MQTT_USERNAME,
    password: configs.MQTT_PASSWORD,
  });
  Container.set('mqttClient', mqttClient);

  mqttClient.on('connect', function () {
    console.log('MQTT connected');

    mqttClient.subscribe(`${configs.MQTT_TOPIC_PREFIX}/location`, function (err) {
      if (err) {
        console.log(err);
      }
    });
  });

  mqttClient.on('message', async function (topic, message) {
    if (topic === `${configs.MQTT_TOPIC_PREFIX}/location`) {
      /**
       * @type {ReceivedLocationData}
       */
      const receivedData = JSON.parse(message.toString());

      const deviceService = new DeviceService();
      const device = await deviceService.handleReceivedLocation(receivedData);

      // TODO: Handle socketio
      /**
       * @type {import('socket.io').Server}
       */
      const socketio = Container.get(DI_KEYS.SOCKETIO);
      if (device?.userId) {
        socketio.to(device?.userId).emit('location-change', {
          lat: receivedData.location[0],
          lng: receivedData.location[1],
        });
      }
    }
  });
};

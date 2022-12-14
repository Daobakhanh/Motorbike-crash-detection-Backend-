const mqtt = require('mqtt');
const { Container } = require('typedi');

const configs = require('../../commons/configs');

module.exports = function mqttLoader() {
  const mqttClient = mqtt.connect(configs.MQTT_HOST, {
    port: configs.MQTT_PORT,
    username: configs.MQTT_USERNAME,
    password: configs.MQTT_PASSWORD,
  });
  Container.set('mqttClient', mqttClient);

  mqttClient.on('connect', function () {
    console.log('MQTT connected');

    mqttClient.subscribe(`${configs.MQTT_TOPIC_PREFIX}/measurements`, function (err) {
      if (err) {
        console.log(err);
      }
    });
  });

  mqttClient.on('message', async function (topic, message) {});
};

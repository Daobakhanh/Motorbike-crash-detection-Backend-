require('dotenv').config();

module.exports = {
  // Server
  PORT: process.env.PORT || 8888,

  // MQTT
  MQTT_HOST: process.env.MQTT_HOST,
  MQTT_PORT: process.env.MQTT_PORT,
  MQTT_USERNAME: process.env.MQTT_USERNAME,
  MQTT_PASSWORD: process.env.MQTT_PASSWORD,
  MQTT_TOPIC_PREFIX: process.env.MQTT_TOPIC_PREFIX || '',
};

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

  // Twilio
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
};

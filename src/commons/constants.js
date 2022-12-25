const MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad request',

  WRONG_USERNAME_OR_PASSWORD: 'Wrong username or password',
};

const DI_KEYS = {
  FB_APP: 'fbApp',
  FB_DB: 'fbDb',
  FB_STORAGE: 'fbStorage',
  FB_AUTH: 'fbAuth',

  MQTT_CLIENT: 'mqttClient',
  SOCKETIO: 'socketio',
};

const DeviceStatus = {
  NONE: Symbol(0),
  FALL: Symbol(1),
  CRASH: Symbol(2),
  LOST1: Symbol(3),
  LOST2: Symbol(4),
  SOS: Symbol(5),
};

module.exports = { MESSAGES, DI_KEYS, DeviceStatus };

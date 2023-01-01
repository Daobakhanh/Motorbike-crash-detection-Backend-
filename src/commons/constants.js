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
  FB_FCM: 'fbFcm',

  MQTT_CLIENT: 'mqttClient',
  SOCKETIO: 'socketio',
};

const DeviceStatus = {
  NONE: 0,
  FALL: 1,
  CRASH: 2,
  LOST1: 3,
  LOST2: 4,
  SOS: 5,
};

const AppRunMode = {
  DEV: 'DEV',
  PROD: 'PROD',
};

module.exports = { MESSAGES, DI_KEYS, DeviceStatus, AppRunMode };

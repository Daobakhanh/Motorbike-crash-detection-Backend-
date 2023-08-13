const configs = require('../../commons/configs');
const logger = require('../../loaders/winston');

const twilioClient = require('twilio')(configs.TWILIO_ACCOUNT_SID, configs.TWILIO_AUTH_TOKEN);

async function sendSMS(to, body = '') {
  try {
    return twilioClient.messages.create({
      from: configs.TWILIO_PHONE_NUMBER,
      to,
      body,
    });
  } catch (error) {
    logger.error(`Error sending SMS to ${to}`, error);
  }
}

async function makeCall(to, url = 'http://demo.twilio.com/docs/voice.xml') {
  try {
    return twilioClient.calls.create({
      from: configs.TWILIO_PHONE_NUMBER,
      to,
      url,
    });
  } catch (error) {
    logger.error(`Error making call to ${to}`, error);
  }
}

module.exports = {
  sendSMS,
  makeCall,
};

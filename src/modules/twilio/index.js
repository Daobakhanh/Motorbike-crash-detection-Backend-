const configs = require('../../commons/configs');

const twilioClient = require('twilio')(configs.TWILIO_ACCOUNT_SID, configs.TWILIO_AUTH_TOKEN);

function sendSMS(to, body = '') {
  return true;
  // return twilioClient.messages.create({
  //   from: configs.TWILIO_PHONE_NUMBER,
  //   to,
  //   body,
  // });
}

function makeCall(to, url = 'http://demo.twilio.com/docs/voice.xml') {
  return twilioClient.calls.create({
    from: configs.TWILIO_PHONE_NUMBER,
    to,
    url,
  });
}

module.exports = {
  sendSMS,
  makeCall,
};

const CronJob = require('cron').CronJob;
const configs = require('../../commons/configs');
const DeviceService = require('../../modules/devices/device.service');
const logger = require('../winston');

const checkDeviceConnectJob = new CronJob(
  `*/${configs.CHECK_DEVICE_INTERVAL} * * * *`,
  () => {
    const deviceService = new DeviceService();

    deviceService.checkDeviceConnect();
  },
  null,
  true,
  'Asia/Ho_Chi_Minh',
);

const cronJobsLoader = () => {
  checkDeviceConnectJob.start();
  logger.info(
    `[CronJob] checkDeviceConnectJob started with interval ${configs.CHECK_DEVICE_INTERVAL} minutes`,
  );
};

module.exports = cronJobsLoader;

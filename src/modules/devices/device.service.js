const { default: Container } = require('typedi');
const { sub, isAfter } = require('date-fns');

const configs = require('../../commons/configs');
const { makeCall, sendSMS } = require('../twilio');
const { DI_KEYS, DeviceStatus } = require('../../commons/constants');
const logger = require('../../loaders/winston');
const UserService = require('../users/user.service');

class DeviceService {
  constructor() {
    /**
     * @type {FirebaseFirestore.Firestore}
     */
    const db = Container.get(DI_KEYS.FB_DB);
    this.deviceCollection = db.collection('devices');
  }

  /**
   * @param {Device} input
   * @returns {Promise<Device>}
   */
  async createOriginDevice(input) {
    try {
      await this.deviceCollection.doc(input.id).set({ ...input, createdAt: new Date() });

      const device = await this.deviceCollection.doc(input.id).get();

      return {
        id: device.id,
        ...device.data(),
      };
    } catch (error) {
      logger.error('[DeviceService][createOriginDevice] error', error);
    }
  }

  /**
   * @param {string} userId
   * @returns {Promise<Device[]>}
   */
  async getDevicesOfUser(userId) {
    try {
      const devices = await this.deviceCollection.where('userId', '==', userId).get();

      return devices.docs.map(device => ({
        id: device.id,
        ...device.data(),
      }));
    } catch (error) {
      logger.error('[DeviceService][getDevicesOfUser] error', error);
    }
  }

  /**
   * @param {string} userId
   * @param {string} deviceId
   * @returns {Promise<Device[]>}
   */
  async getDeviceOfUser(userId, deviceId) {
    try {
      const device = await this.deviceCollection.doc(deviceId).get();
      if (!device.exists || device.data().userId !== userId) {
        return null;
      }

      return {
        id: device.id,
        ...device.data(),
      };
    } catch (error) {
      logger.error('[DeviceService][getDeviceOfUser] error', error);
    }
  }

  async link({ userId, deviceId, verificationCode }) {
    try {
      const device = await this.deviceCollection.doc(deviceId).get();

      if (!device.exists) {
        throw new Error('Device not found');
      }

      if (device.data().verificationCode !== verificationCode) {
        throw new Error('Wrong verification code');
      }

      await this.deviceCollection.doc(deviceId).update({
        userId,
      });

      return {
        id: device.id,
        ...device.data(),
      };
    } catch (error) {
      logger.error('[DeviceService][link] error', error);
    }
  }

  /**
   *
   * @param {string} deviceId
   * @param {Partial<Device>} data
   * @returns
   */
  async update(deviceId, data) {
    try {
      delete data?.userId;
      delete data?.id;
      delete data?.verificationCode;
      delete data?.createdAt;

      await this.deviceCollection.doc(deviceId).update(data);

      const device = await this.deviceCollection.doc(deviceId).get();

      return {
        id: device.id,
        ...device.data(),
      };
    } catch (error) {
      logger.error('[DeviceService][update] error', error);
    }
  }

  /**
   * @param {string} userId
   * @param {string} deviceId
   * @returns {Promise<boolean>}
   */
  async checkDeviceOfUser(userId, deviceId) {
    try {
      const device = await this.deviceCollection.doc(deviceId).get();

      if (!device.exists || device.data().userId !== userId) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('[DeviceService][checkDeviceOfUser] error', error);
    }
  }

  /**
   * @param {ReceivedLocationData} input
   * @returns {Device | null}
   */
  async handleReceivedLocation(input) {
    try {
      const device = await this.deviceCollection.doc(input.deviceId).get();

      if (!device.exists) {
        return null;
      }

      const deviceData = device.data();
      if (!deviceData.locations || !Array.isArray(deviceData.locations)) {
        deviceData.locations = [];
      }
      deviceData.locations.push({
        latitude: input.location[0],
        longitude: input.location[1],
        createdAt: new Date(),
      });
      deviceData.config.antiTheft = input.toggleAntiTheft;
      deviceData.status = input.status;

      if (
        !deviceData.properties ||
        !deviceData.properties?.lastCall ||
        !deviceData.properties?.lastSms
      ) {
        deviceData.properties = {
          lastCall: null,
          lastSms: null,
        };
      }

      const userService = new UserService();
      /**
       * @type {User}
       */
      const user = await userService.getUserInfo(deviceData.userId);

      const needToCall = isAfter(
        sub(new Date(), {
          minutes: 2,
        }),
        deviceData.properties.lastCall.toDate(),
      );

      if (
        deviceData.status === DeviceStatus.SOS &&
        (needToCall || !deviceData.properties?.lastCall || !deviceData.properties?.lastSms)
      ) {
        makeCall(user.phoneNumber);
        sendSMS(user.phoneNumber, 'Your device is in danger');

        logger.info(
          '[DeviceService][handleReceivedLocation] Make call and send sms to ' + user.phoneNumber,
        );

        deviceData.properties.lastCall = new Date();
        deviceData.properties.lastSms = new Date();

        /**
         * @type {import ('firebase-admin').messaging.Messaging}
         */
        const fcm = Container.get(DI_KEYS.FB_FCM);
        fcm.sendToDevice(user.fcmTokens, {
          notification: {
            title: input.status === DeviceStatus.SOS ? 'SOS' : 'Lost vehicle detected',
            body:
              input.status === DeviceStatus.SOS
                ? 'The vehicle is in dangerous!!'
                : 'Your vehicle is lost',
          },
        });
      }

      await this.deviceCollection.doc(input.deviceId).update({
        ...deviceData,
      });

      return {
        id: device.id,
        ...deviceData,
      };
    } catch (error) {
      logger.error('[DeviceService][handleReceivedLocation] error', error);
    }
  }

  /**
   *
   * @param {string} deviceId
   * @param {Object} config
   * @returns
   */
  async requestToDevice(deviceId, config) {
    try {
      const device = await this.deviceCollection.doc(deviceId).get();

      if (!device.exists) {
        return null;
      }

      const deviceData = device.data();

      await this.deviceCollection.doc(deviceId).update({
        ...deviceData,
        config: {
          ...deviceData.config,
          antiTheft: config.toggleAntiTheft || deviceData.config?.antiTheft,
        },
      });

      /**
       * @type {import('mqtt').Client}
       */
      const mqttClient = Container.get(DI_KEYS.MQTT_CLIENT);
      const dataToSend = {};
      if (config.needUpdateLocation !== undefined) {
        dataToSend.needUpdateLocation = config.needUpdateLocation;
      }
      if (config.toggleAntiTheft !== undefined) {
        dataToSend.toggleAntiTheft = config.toggleAntiTheft;
      }
      if (config.offWarning !== undefined) {
        dataToSend.offWarning = config.offWarning;
      }
      mqttClient.publish(`${configs.MQTT_TOPIC_PREFIX}/update`, JSON.stringify(dataToSend));

      return {
        id: device.id,
        ...deviceData,
      };
    } catch (error) {
      logger.error('[DeviceService][requestToDevice] error', error);
    }
  }
}

module.exports = DeviceService;

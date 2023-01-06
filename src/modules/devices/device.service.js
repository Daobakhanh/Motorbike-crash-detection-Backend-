const { default: Container } = require('typedi');
const { sub, isAfter } = require('date-fns');

const configs = require('../../commons/configs');
const { makeCall, sendSMS } = require('../twilio');
const { DI_KEYS, DeviceStatus } = require('../../commons/constants');
const logger = require('../../loaders/winston');
const UserService = require('../users/user.service');
const UserNotificationService = require('../user-notifications/user-notification.service');

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
   * @param {DeviceStatus} deviceStatus
   * @returns
   * @private
   */
  getActionData(deviceStatus) {
    switch (deviceStatus) {
      case DeviceStatus.NONE:
        return {
          title: '',
          content: '',
          actions: [],
        };
      case DeviceStatus.FALL:
        return {
          title: 'Warning',
          content: 'Your vehicle has fallen',
          actions: ['pushNotification', 'sendSms'],
        };
      case DeviceStatus.CRASH:
        return {
          title: 'Warning',
          content: 'Your vehicle has crashed',
          actions: ['pushNotification', 'sendSms', 'makeCall'],
        };
      case DeviceStatus.LOST1:
        return {
          title: 'Your vehicle may be lost',
          content: 'Your vehicle is 10m away from previous location',
          actions: ['pushNotification', 'sendSms'],
        };
      case DeviceStatus.LOST2:
        return {
          title: 'Your vehicle may be lost',
          content: 'Your vehicle is 50m away from previous location',
          actions: ['pushNotification', 'sendSms', 'makeCall'],
        };
      case DeviceStatus.SOS:
        return {
          title: 'SOS',
          content: 'There is an emergency situation',
          actions: ['pushNotification', 'sendSms', 'makeCall'],
        };
      default:
        return {};
    }
  }

  /**
   * @param {ReceivedLocationData} input
   * @returns {Device | null}
   */
  async handleReceivedLocation(input) {
    try {
      const userService = new UserService();
      /**
       * @type {import ('firebase-admin').messaging.Messaging}
       */
      const fcm = Container.get(DI_KEYS.FB_FCM);
      const userNotificationService = new UserNotificationService();

      const doc = await this.deviceCollection.doc(input.deviceId).get();
      if (!doc.exists) {
        return null;
      }

      /**
       * @type {Device}
       */
      const device = doc.data();
      device.id = doc.id;
      if (!device.userId) {
        return null;
      }

      /**
       * @type {User}
       */
      const user = await userService.getUserInfo(device.userId);

      // Insert location
      if (!device.locations || !Array.isArray(device.locations)) {
        device.locations = [];
      }
      device.locations.push({
        latitude: input.location[0],
        longitude: input.location[1],
        createdAt: new Date(),
      });

      // Update status
      device.config.antiTheft = input.antiTheft;
      device.status = input.status;

      if (!device.properties) {
        device.properties = {
          lastMakeCallTime: null,
          lastSendSmsTime: null,
          lastPushNotificationTime: null,
        };
      }

      // Emit socketio
      /**
       * @type {import('socket.io').Server}
       */
      const socketio = Container.get(DI_KEYS.SOCKETIO);
      socketio.to(device.userId).emit('location-change', {
        latitude: input.location[0],
        longitude: input.location[1],
      });

      const action = this.getActionData(device.status);
      const phoneNumber = user.sosNumbers?.[0] || user.phoneNumber;
      if (action.actions.includes('pushNotification')) {
        const needToPushNotification =
          isAfter(
            sub(new Date(), {
              minutes: 2,
            }),
            device.properties.lastPushNotificationTime?.toDate(),
          ) || !device.properties.lastPushNotificationTime;

        if (needToPushNotification) {
          await fcm.sendToDevice(user.fcmTokens, {
            notification: {
              title: action.title,
              body: action.content,
            },
          });
          await userNotificationService.createUserNotification(device.userId, {
            title: action.title,
            content: action.content,
            type: device.status,
            userId: device.userId,
            deviceId: device.id,
            createdAt: new Date(),
          });
          device.properties.lastPushNotificationTime = new Date();
          logger.info(
            '[DeviceService][handleReceivedLocation] Push notification to ' + phoneNumber,
          );
        }
      }
      if (action.actions.includes('sendSms')) {
        const needToSendSms =
          isAfter(
            sub(new Date(), {
              minutes: 5,
            }),
            device.properties.lastSendSmsTime?.toDate(),
          ) || !device.properties.lastSendSmsTime;
        if (needToSendSms) {
          sendSMS(phoneNumber);
          device.properties.lastSendSmsTime = new Date();
          logger.info('[DeviceService][handleReceivedLocation] Send sms to ' + phoneNumber);
        }
      }
      if (action.actions.includes('makeCall')) {
        const needToMakeCall =
          isAfter(
            sub(new Date(), {
              minutes: 2,
            }),
            device.properties.lastMakeCallTime?.toDate(),
          ) || !device.properties.lastMakeCallTime;
        if (needToMakeCall) {
          makeCall(phoneNumber);
          device.properties.lastMakeCallTime = new Date();
          logger.info('[DeviceService][handleReceivedLocation] Make call to ' + phoneNumber);
        }
      }

      await this.deviceCollection.doc(input.deviceId).update({
        ...device,
      });

      return {
        id: doc.id,
        ...device,
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
      const doc = await this.deviceCollection.doc(deviceId).get();

      if (!doc.exists) {
        return null;
      }

      /**
       * @type {Device}
       */
      const device = {
        id: doc.id,
        ...doc.data(),
      };

      if (config.antiTheft !== undefined) {
        device.config.antiTheft = config.antiTheft;
      }
      if (config.warning == false) {
        device.status = 0;
      }

      await this.deviceCollection.doc(deviceId).update({
        ...device,
      });

      /**
       * @type {import('mqtt').Client}
       */
      const mqttClient = Container.get(DI_KEYS.MQTT_CLIENT);
      const dataToSend = {};
      if (config.updateLocation !== undefined) {
        dataToSend.updateLocation = config.updateLocation;
      }
      if (config.antiTheft !== undefined) {
        dataToSend.antiTheft = config.antiTheft;
      }
      if (config.warning !== undefined) {
        dataToSend.warning = config.warning;
      }

      mqttClient.publish(`${configs.MQTT_TOPIC_PREFIX}/update`, JSON.stringify(dataToSend));

      return {
        id: doc.id,
        ...device,
      };
    } catch (error) {
      logger.error('[DeviceService][requestToDevice] error', error);
    }
  }
}

module.exports = DeviceService;

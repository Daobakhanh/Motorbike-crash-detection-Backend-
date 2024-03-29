const { default: Container } = require('typedi');
const { sub, isAfter } = require('date-fns');
const { Timestamp } = require('@google-cloud/firestore');

const configs = require('../../commons/configs');
const { makeCall, sendSMS } = require('../twilio');
const { DI_KEYS, DeviceStatus, UserNotificationType } = require('../../commons/constants');
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
      delete data?.battery;
      delete data?.isCharging;

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
   * @param {number} type
   * @private
   */
  getActionData(type, offWarning = false) {
    switch (type) {
      case DeviceStatus.NONE:
        if (offWarning) {
          return {
            title: 'Stopped warning',
            content: 'Your vehicle is safe now',
            actions: ['pushNotification', 'sendSms'],
          };
        } else {
          return {
            title: '',
            content: '',
            actions: [],
          };
        }
      // case DeviceStatus.FALL:
      //   return {
      //     title: 'Warning',
      //     content: 'Your vehicle has fallen',
      //     actions: ['pushNotification', 'sendSms'],
      //   };
      case DeviceStatus.CRASH:
        return {
          title: 'Warning',
          content: 'Your vehicle has crashed',
          actions: ['pushNotification', 'sendSms', 'makeCall'],
        };
      case DeviceStatus.LOST1:
        return {
          title: 'May be lost',
          content: 'Your vehicle is 10m away from previous location',
          actions: ['pushNotification', 'sendSms'],
        };
      case DeviceStatus.LOST2:
        return {
          title: 'May be lost',
          content: 'Your vehicle is 50m away from previous location',
          actions: ['pushNotification', 'sendSms', 'makeCall'],
        };
      case DeviceStatus.SOS:
        return {
          title: 'SOS',
          content: 'There is an emergency situation',
          actions: ['pushNotification', 'sendSms', 'makeCall'],
        };
      case UserNotificationType.OFF_ANTI_THEFT:
        return {
          title: 'Off Anti-theft',
          content: 'Your vehicle is not protected by anti-theft',
          actions: ['pushNotification', 'sendSms'],
        };
      case UserNotificationType.ON_ANTI_THEFT:
        return {
          title: 'On Anti-theft',
          content: 'Your vehicle is protected by anti-theft',
          actions: ['pushNotification', 'sendSms'],
        };
      case UserNotificationType.LOW_BATTERY:
        return {
          title: 'Low Battery',
          content: 'Your device is about run out of battery',
          actions: ['pushNotification', 'sendSms'],
        };
      case UserNotificationType.DISCONNECTED:
        return {
          title: 'Disconnected',
          content: 'Your device is disconnected',
          actions: ['pushNotification', 'sendSms'],
        };

      default:
        return {};
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async checkDeviceConnect() {
    try {
      const now = new Date();
      /**
       * @type {Device[]}
       */
      const devices = await (
        await this.deviceCollection.get()
      ).docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      for (const device of devices) {
        if (
          isAfter(
            sub(now, {
              minutes: configs.CHECK_DEVICE_INTERVAL,
            }),
            device.locations?.[0]?.createdAt?.toDate(),
          ) &&
          configs.CHECK_DEVICE_INTERVAL &&
          device.isConnected
        ) {
          logger.info('[DeviceService][checkDeviceConnect] Device ' + device.id + ' disconnected');

          await this.deviceCollection.doc(device.id).update({
            isConnected: false,
          });

          await this.handleAction(UserNotificationType.DISCONNECTED, device);
        }
      }
    } catch (error) {
      logger.error('[DeviceService][checkDeviceConnect] error', error);
    }
  }

  /**
   * @param {UserNotificationType} actionType
   * @param {Device} device
   * @param {boolean} isNewStatus
   * @param {boolean} isNewConfig
   * @returns {Promise<void>}
   */
  async handleAction(actionType, device, isNewStatus = false, isNewConfig = false) {
    try {
      /**
       * @type {import ('firebase-admin').messaging.Messaging}
       */
      const fcm = Container.get(DI_KEYS.FB_FCM);
      const userNotificationService = new UserNotificationService();
      const userService = new UserService();

      const user = await userService.getUserInfo(device.userId);
      const phoneNumber = user.sosNumbers?.[0] || user.phoneNumber;

      const action = this.getActionData(actionType);
      if (action.actions.includes('pushNotification')) {
        const needToPushNotification =
          // isAfter(
          //   sub(new Date(), {
          //     minutes: 2,
          //   }),
          //   device.properties.lastPushNotificationTime?.toDate(),
          // ) ||
          !device.properties.lastPushNotificationTime ||
          isNewStatus ||
          isNewConfig ||
          actionType === UserNotificationType.DISCONNECTED;

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
            type: actionType,
            userId: device.userId,
            deviceId: device.id,
            createdAt: Timestamp.fromDate(new Date()),
          });
          device.properties.lastPushNotificationTime = new Date();
          logger.info(
            '[DeviceService][handleAction] Push notification to ' + user.id + ' ' + action.content,
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
          ) ||
          !device.properties.lastSendSmsTime ||
          isNewStatus ||
          isNewConfig;
        if (needToSendSms) {
          configs.TWILIO_ENABLED && sendSMS(phoneNumber, action.content);
          device.properties.lastSendSmsTime = new Date();
          logger.info(
            '[DeviceService][handleAction] Send sms to ' + phoneNumber + ' ' + action.content,
          );
        }
      }
      if (action.actions.includes('makeCall')) {
        const needToMakeCall =
          isAfter(
            sub(new Date(), {
              minutes: 2,
            }),
            device.properties.lastMakeCallTime?.toDate(),
          ) ||
          !device.properties.lastMakeCallTime ||
          isNewStatus;
        if (needToMakeCall) {
          configs.TWILIO_ENABLED && makeCall(phoneNumber);
          device.properties.lastMakeCallTime = new Date();
          logger.info('[DeviceService][handleAction] Make call to ' + phoneNumber);
        }
      }
    } catch (error) {
      logger.error('[DeviceService][handleAction] error', error);
    }
  }

  /**
   * @param {ReceivedLocationData} input
   * @returns {Device | null}
   */
  async handleReceivedLocation(input) {
    try {
      /**
       * @type {import('socket.io').Server}
       */
      const socketio = Container.get(DI_KEYS.SOCKETIO);
      const userService = new UserService();

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
      device.isConnected = true;

      // Insert location
      if (!device.locations || !Array.isArray(device.locations)) {
        device.locations = [];
      }
      device.locations.unshift({
        latitude: input.location[0],
        longitude: input.location[1],
        createdAt: Timestamp.fromDate(new Date()),
      });

      // Update properties
      if (!device.properties) {
        device.properties = {
          lastMakeCallTime: null,
          lastSendSmsTime: null,
          lastPushNotificationTime: null,
        };
      }

      // Update config and status
      const isNewStatus = device.status !== input.status;
      const isNewConfig = device.config.antiTheft !== input.antiTheft;
      device.config.antiTheft = input.antiTheft;
      device.status = input.status;

      let actionType = UserNotificationType.NONE;
      if (isNewStatus) {
        actionType = input.status;
      } else if (isNewConfig) {
        actionType = input.antiTheft
          ? UserNotificationType.ON_ANTI_THEFT
          : UserNotificationType.OFF_ANTI_THEFT;
      } else if (device.battery > 20 && input.battery <= 20) {
        actionType = UserNotificationType.LOW_BATTERY;
      }

      await this.handleAction(actionType, device, isNewStatus, isNewConfig);

      // Emit socketio to client in room
      socketio.to(device.userId).emit('location-change', device);

      await this.deviceCollection.doc(input.deviceId).update({
        ...device,
        battery: input.battery,
        isCharging: input.isCharging || input.isConnected,
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

      if (config.warning == false) {
        device.status = 0;
      }
      delete config.warning;

      device.config = {
        ...device.config,
        ...config,
      };

      await this.deviceCollection.doc(deviceId).update({
        ...device,
      });

      /**
       * @type {import('mqtt').Client}
       */
      const mqttClient = Container.get(DI_KEYS.MQTT_CLIENT);
      const dataToSend = {
        deviceId,
        updateLocation: true,
        antiTheft: device.config.antiTheft,
        warning: config.warning,
      };
      mqttClient.publish(`${configs.MQTT_TOPIC_PREFIX}/update`, JSON.stringify(dataToSend));

      return device;
    } catch (error) {
      logger.error('[DeviceService][requestToDevice] error', error);
    }
  }

  async requestSetRootToDevice(deviceId, root) {
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

      /**
       * @type {import('mqtt').Client}
       */
      const mqttClient = Container.get(DI_KEYS.MQTT_CLIENT);
      const dataToSend = {
        deviceId,
        updateLocation: true,
        antiTheft: device.config.antiTheft,
        warning: device.config.warning,
      };
      mqttClient.publish(`${configs.MQTT_TOPIC_PREFIX}/update`, JSON.stringify(dataToSend));

      return device;
    } catch (error) {
      logger.error('[DeviceService][requestSetRootToDevice] error', error);
    }
  }
}

module.exports = DeviceService;

const { default: Container } = require('typedi');
const configs = require('../../commons/configs');
const { makeCall, sendSMS } = require('../twilio');

require('../../types');
const { DI_KEYS, DeviceStatus } = require('../../commons/constants');

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
      console.log(error);
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
      console.log(error);
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
      console.log(error);
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
      console.log(error);
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
      console.log(error);
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
      console.log(error);
    }
  }

  /**
   * @param {ReceivedLocationData} input
   * @returns
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

      if (!deviceData.properties) {
        deviceData.properties = {};
      }

      if (
        deviceData.status === DeviceStatus.SOS &&
        deviceData.properties.lastCall.toDate() < new Date().getTime() - 1000 * 60 * 2 &&
        deviceData.properties.lastCall.toDate() < new Date() - 1000 * 60 * 2
      ) {
        await makeCall('+84357698570');
        // await sendSMS('+84357698570', 'SOS SOS');
        deviceData.properties.lastCall = new Date();
        deviceData.properties.lastSms = new Date();
      }

      await this.deviceCollection.doc(input.deviceId).update({
        ...deviceData,
      });

      return {
        id: device.id,
        ...deviceData,
      };
    } catch (error) {
      console.log(error);
    }
  }

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
      console.log(error);
    }
  }
}

module.exports = DeviceService;

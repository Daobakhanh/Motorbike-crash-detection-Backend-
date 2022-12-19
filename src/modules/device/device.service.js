const { default: Container } = require('typedi');

require('../../types');
const { DI_KEYS } = require('../../commons/constants');

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
      const device = await (await this.deviceCollection.add(input)).get();

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
}

module.exports = new DeviceService();

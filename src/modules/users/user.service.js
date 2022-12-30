const { default: Container } = require('typedi');

require('../../types');
const { DI_KEYS } = require('../../commons/constants');
const logger = require('../../loaders/winston');

class UserService {
  constructor() {
    /**
     * @type {FirebaseFirestore.Firestore}
     */
    const db = Container.get(DI_KEYS.FB_DB);
    this.userCollection = db.collection('users');
  }

  /**
   * @param {string} userId
   * @returns {Promise<User>}
   */
  async getUserInfo(userId) {
    try {
      const userDoc = await this.userCollection.doc(userId).get();

      return {
        id: userDoc.id,
        ...userDoc.data(),
      };
    } catch (error) {
      logger.error('[UserService][getUserInfo] error', error);
    }
  }

  /**
   * @param {string} userId
   * @param {Partial<User>} data
   * @returns {Promise<User>}
   */
  async updateUserInfo(userId, data) {
    try {
      await this.userCollection.doc(userId).update(data);

      return this.getUserInfo(userId);
    } catch (error) {
      logger.error('[UserService][updateUserInfo] error', error);
    }
  }
}

module.exports = UserService;

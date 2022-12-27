const { default: Container } = require('typedi');

require('../../types');
const { DI_KEYS } = require('../../commons/constants');

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
      console.log(error);
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
      console.log(error);
    }
  }
}

module.exports = UserService;

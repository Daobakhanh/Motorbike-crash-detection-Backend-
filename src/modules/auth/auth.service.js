const { default: Container } = require('typedi');

require('../../types');
const { DI_KEYS } = require('../../commons/constants');

class AuthService {
  constructor() {
    /**
     * @type {FirebaseFirestore.Firestore}
     */
    const db = Container.get(DI_KEYS.FB_DB);
    this.userCollection = db.collection('users');
  }

  /**
   * @param {string} userId
   * @param {Partial<User>} data
   * @returns
   */
  async signup(userId, data) {
    try {
      await this.userCollection.doc(userId).set(data);

      return {
        id: userId,
        ...data,
        fcmTokens: data.fcmTokens || [],
        lastSignInAt: new Date(),
      };
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @param {string} userId
   * @param {string} fcmToken
   */
  async signin(userId, fcmToken) {
    try {
      const userDoc = await this.userCollection.doc(userId).get();
      const userData = userDoc.data();
      const user = {
        id: userDoc.id,
        ...userData,
        lastSignInAt: new Date(),
      };

      const fcmTokens = userData.fcmTokens || [];
      if (!fcmTokens.includes(fcmToken)) {
        fcmTokens.push(fcmToken);
      }

      return user;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @param {string} userId
   * @param {string} fcmToken
   */
  async signout(userId, fcmToken) {
    try {
      const userDoc = await this.userCollection.doc(userId).get();
      const userData = userDoc.data();
      const fcmTokens = userData.fcmTokens || [];
      const index = fcmTokens.indexOf(fcmToken);
      if (index > -1) {
        fcmTokens.splice(index, 1);
      }

      await this.userCollection.doc(userId).update({
        fcmTokens,
      });

      return {
        id: userDoc.id,
        ...userData,
        fcmTokens,
      };
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = AuthService;

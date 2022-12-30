const { default: Container } = require('typedi');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const jwtVerify = promisify(jwt.verify);

const { DI_KEYS } = require('../../commons/constants');
const configs = require('../../commons/configs');
const logger = require('../../loaders/winston');

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

      const user = {
        id: userId,
        ...data,
        fcmTokens: data.fcmTokens || [],
        lastSignInAt: new Date(),
      };

      return {
        accessToken: this.generateJwt(user),
        user,
      };
    } catch (error) {
      logger.error(error);
    }
  }

  /**
   * @param {string} userId
   */
  async signin(userId, { fcmToken }) {
    try {
      const userDoc = await this.userCollection.doc(userId).get();
      const userData = userDoc.data();

      const fcmTokens = userData.fcmTokens || [];
      if (!fcmTokens.includes(fcmToken)) {
        fcmTokens.push(fcmToken);
      }

      await this.userCollection.doc(userId).update({
        fcmTokens,
        lastSignInAt: new Date(),
      });

      /**
       * @type {User}
       */
      const user = {
        id: userDoc.id,
        ...userData,
        fcmTokens,
        lastSignInAt: new Date(),
      };

      return {
        accessToken: this.generateJwt(user),
        user,
      };
    } catch (error) {
      logger.error(error);
    }
  }

  /**
   * @param {string} userId
   */
  async signout(userId, { fcmToken }) {
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
      logger.error(error);
    }
  }

  /**
   *
   * @param {User} user
   * @returns {string}
   * @private
   */
  generateJwt(user) {
    const payload = {
      user,
    };
    const token = jwt.sign(payload, configs.JWT_SECRET_KEY, {
      expiresIn: configs.JWT_EXPIRATION_TIME,
      algorithm: configs.JWT_ALGORITHM,
    });
    return token;
  }

  /**
   * @param {string} token
   * @returns {User | null}
   */
  async verifyAccessToken(token) {
    try {
      const decoded = await jwtVerify(token, configs.JWT_SECRET_KEY);

      return decoded.user;
    } catch (error) {
      return null;
    }
  }
}

module.exports = AuthService;

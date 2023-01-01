const { default: Container } = require('typedi');

require('../../types');
const { DI_KEYS } = require('../../commons/constants');
const logger = require('../../loaders/winston');

class UserNotificationService {
  constructor() {
    /**
     * @type {FirebaseFirestore.Firestore}
     */
    const db = Container.get(DI_KEYS.FB_DB);
    this.userNotificationCollection = db.collection('user-notifications');
  }

  /**
   * @param {string} userId
   * @returns {Promise<UserNotification[]>}
   */
  async getAllUserNotifications(userId) {
    try {
      const snapshot = await this.userNotificationCollection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error('[UserNotificationService][getAllUserNotifications] error', error);
    }
  }

  /**
   * @param {string} userId
   * @param {Partial<UserNotification>} data
   * @returns {Promise<UserNotification>}
   */
  async createUserNotification(userId, data) {
    try {
      const docRef = await this.userNotificationCollection.add({
        ...data,
        userId,
        isRead: false,
        createdAt: new Date(),
      });

      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      logger.error('[UserNotificationService][createUserNotification] error', error);
    }
  }

  /**
   * @param {string} userId
   * @param {string} notificationId
   * @returns {Promise<boolean>}
   */
  async checkUserNotification(userId, notificationId) {
    try {
      const docRef = this.userNotificationCollection.doc(notificationId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return false;
      }

      const data = doc.data();
      if (data.userId !== userId) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('[UserNotificationService][checkUserNotification] error', error);
    }
  }

  /**
   * @param {string} notificationId
   * @param {boolean} isRead
   * @returns {Promise<UserNotification>}
   */
  async updateIsReadUserNotification(notificationId, isRead = true) {
    try {
      const docRef = await this.userNotificationCollection.doc(notificationId).update({
        isRead,
      });

      const doc = await docRef.get();
      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() };
    } catch (error) {
      logger.error('[UserNotificationService][updateIsReadUserNotification] error', error);
    }
  }
}

module.exports = UserNotificationService;

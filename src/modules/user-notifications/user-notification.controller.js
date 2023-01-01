const apiResult = require('../../helpers/api-result.helper');
const authMiddleware = require('../auth/auth.middleware');
const UserNotificationService = require('./user-notification.service');

const userNotificationController = require('express').Router();

userNotificationController.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userNotificationService = new UserNotificationService();

    const result = await userNotificationService.getAllUserNotifications(req.user.id);

    return res.json(apiResult('Get user notifications successfully', result));
  } catch (error) {
    next(error);
  }
});

userNotificationController.put('/read', authMiddleware, async (req, res, next) => {
  try {
    const userNotificationService = new UserNotificationService();

    const result = await userNotificationService.updateIsReadUserNotification(
      req.user.id,
      req.body.isRead,
    );

    return res.json(apiResult('Update read status of user notification successfully', result));
  } catch (error) {
    next(error);
  }
});

module.exports = userNotificationController;

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

userNotificationController.put('/read/:id', authMiddleware, async (req, res, next) => {
  try {
    const userNotificationService = new UserNotificationService();

    const { id } = req.params;
    const isValidId = await userNotificationService.checkUserNotification(req.user.id, id);
    if (!isValidId) {
      return res.status(404).json(apiResult('User notification not found'));
    }

    const result = await userNotificationService.updateIsReadUserNotification(id, req.body.isRead);

    return res.json(apiResult('Update read status of user notification successfully', result));
  } catch (error) {
    next(error);
  }
});

module.exports = userNotificationController;

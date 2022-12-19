const apiResult = require('../../helpers/api-result.helper');
const authMiddleware = require('../auth/auth.middleware');
const userService = require('./user.service');

const userController = require('express').Router();

userController.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const result = await userService.getUserInfo(req.userId);
    return res.json(apiResult('Get user information successfully', result));
  } catch (error) {
    next(error);
  }
});

userController.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const result = await userService.updateUserInfo(req.userId, req.body);
    return res.json(apiResult('Update user information successfully', result));
  } catch (error) {
    next(error);
  }
});

module.exports = userController;

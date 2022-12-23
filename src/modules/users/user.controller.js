const apiResult = require('../../helpers/api-result.helper');
const authMiddleware = require('../auth/auth.middleware');
const UserService = require('./user.service');

const userController = require('express').Router();

userController.get('/me', authMiddleware, async (req, res, next) => {
  try {
    return res.json(apiResult('Get user information successfully', req.user));
  } catch (error) {
    next(error);
  }
});

userController.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const userService = new UserService();
    const result = await userService.updateUserInfo(req.user.id, req.body);
    return res.json(apiResult('Update user information successfully', result));
  } catch (error) {
    next(error);
  }
});

module.exports = userController;

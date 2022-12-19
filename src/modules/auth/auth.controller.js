const apiResult = require('../../helpers/api-result.helper');
const authMiddleware = require('./auth.middleware');
const authService = require('./auth.service');

const authController = require('express').Router();

authController.post('/signup', authMiddleware, async (req, res, next) => {
  try {
    var result = await authService.signup(req.userId, req.body);
    return res.json(apiResult('Signup successfully', result));
  } catch (error) {
    next(error);
  }
});

authController.post('/signin', authMiddleware, async (req, res, next) => {
  try {
    var result = await authService.signin(req.userId, req.body.fcmToken);
    return res.json(apiResult('Signin successfully', result));
  } catch (error) {
    next(error);
  }
});

authController.post('/signout', authMiddleware, async (req, res, next) => {
  try {
    var result = await authService.signout(req.userId, req.body.fcmToken);
    return res.json(apiResult('Signout successfully', result));
  } catch (error) {
    next(error);
  }
});

module.exports = authController;

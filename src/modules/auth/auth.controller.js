const apiResult = require('../../helpers/api-result.helper');
const fbAuthMiddleware = require('./fb-auth.middleware');
const authMiddleware = require('./auth.middleware');
const AuthService = require('./auth.service');

const authController = require('express').Router();

authController.post('/signup', fbAuthMiddleware, async (req, res, next) => {
  try {
    const authService = new AuthService();
    var result = await authService.signup(req.user.id, req.body);
    return res.json(apiResult('Signup successfully', result));
  } catch (error) {
    next(error);
  }
});

authController.post('/signin', fbAuthMiddleware, async (req, res, next) => {
  try {
    const authService = new AuthService();
    var result = await authService.signin(req.user.id, req.body);
    return res.json(apiResult('Signin successfully', result));
  } catch (error) {
    next(error);
  }
});

authController.post('/signout', authMiddleware, async (req, res, next) => {
  try {
    const authService = new AuthService();
    var result = await authService.signout(req.user.id, req.body);
    return res.json(apiResult('Signout successfully', result));
  } catch (error) {
    next(error);
  }
});

module.exports = authController;

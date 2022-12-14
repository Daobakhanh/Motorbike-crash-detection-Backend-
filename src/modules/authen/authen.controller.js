const apiResult = require('../../helpers/api-result.helper');
const authenService = require('./authen.service');
const jwtMiddleware = require('./jwt.middleware');

const authenController = require('express').Router();

authenController.post('/login', async (req, res, next) => {
  try {
    var result = await authenService.login();
    return res.json(apiResult('Login successfully', result));
  } catch (error) {
    next(error);
  }
});

authenController.get('/user-info', jwtMiddleware, async (req, res, next) => {
  try {
    var result = await authenService.getUserInfo(req.userId);
    return res.json(apiResult('Get user info successfully', result));
  } catch (error) {
    next(error);
  }
});

module.exports = authenController;

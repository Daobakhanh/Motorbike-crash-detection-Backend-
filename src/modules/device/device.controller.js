const apiResult = require('../../helpers/api-result.helper');
const authMiddleware = require('../auth/auth.middleware');
const deviceService = require('./device.service');

const deviceController = require('express').Router();

deviceController.post('/', authMiddleware, async (req, res, next) => {
  try {
    const result = await deviceService.createOriginDevice(req.body);
    return res.json(apiResult('Create device successfully', result));
  } catch (error) {
    next(error);
  }
});

deviceController.get('/', authMiddleware, async (req, res, next) => {
  try {
    const result = await deviceService.getDevicesOfUser(req.userId);
    return res.json(apiResult('Get devices successfully', result));
  } catch (error) {
    next(error);
  }
});

deviceController.post('/link', authMiddleware, async (req, res, next) => {
  try {
    const result = await deviceService.link({ userId: req.userId, ...req.body });

    return res.json(apiResult('Link device successfully', result));
  } catch (error) {
    next(error);
  }
});

deviceController.put('/:deviceId', authMiddleware, async (req, res, next) => {
  try {
    const isOwner = await deviceService.checkDeviceOfUser(req.userId, req.params.deviceId);
    if (!isOwner) {
      return res.status(403).json(apiResult('You are not the owner of this device'));
    }

    const result = await deviceService.update(req.params.deviceId, req.body);

    return res.json(apiResult('Update device successfully', result));
  } catch (error) {
    next(error);
  }
});

module.exports = deviceController;

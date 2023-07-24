const apiResult = require('../../helpers/api-result.helper');
const authMiddleware = require('../auth/auth.middleware');
const DeviceService = require('./device.service');

const deviceController = require('express').Router();

deviceController.post('/', async (req, res, next) => {
  try {
    const deviceService = new DeviceService();
    const result = await deviceService.createOriginDevice(req.body);
    return res.json(apiResult('Create device successfully', result));
  } catch (error) {
    next(error);
  }
});

deviceController.get('/', authMiddleware, async (req, res, next) => {
  try {
    const deviceService = new DeviceService();
    const result = await deviceService.getDevicesOfUser(req.user.id);
    return res.json(apiResult('Get devices successfully', result));
  } catch (error) {
    next(error);
  }
});

deviceController.get('/:deviceId', authMiddleware, async (req, res, next) => {
  try {
    const deviceService = new DeviceService();
    const result = await deviceService.getDeviceOfUser(req.user.id, req.params.deviceId);
    return res.json(apiResult('Get device successfully', result));
  } catch (error) {
    next(error);
  }
});

deviceController.post('/link', authMiddleware, async (req, res, next) => {
  try {
    const deviceService = new DeviceService();
    const result = await deviceService.link({ userId: req.user.id, ...req.body });

    return res.json(apiResult('Link device successfully', result));
  } catch (error) {
    next(error);
  }
});

deviceController.put('/:deviceId', authMiddleware, async (req, res, next) => {
  try {
    const deviceService = new DeviceService();
    const isOwner = await deviceService.checkDeviceOfUser(req.user.id, req.params.deviceId);
    if (!isOwner) {
      return res.status(403).json(apiResult('You are not the owner of this device'));
    }

    const result = await deviceService.update(req.params.deviceId, req.body);

    return res.json(apiResult('Update device successfully', result));
  } catch (error) {
    next(error);
  }
});

deviceController.post('/request/:deviceId', async (req, res, next) => {
  try {
    const deviceService = new DeviceService();
    const result = await deviceService.requestToDevice(req.params.deviceId, req.body);

    return res.json(apiResult('Request to device successfully', result));
  } catch (error) {
    next(error);
  }
});

deviceController.post('/request-set-root/:deviceId', async (req, res, next) => {
  try {
    const deviceService = new DeviceService();
    const result = await deviceService.requestSetRootToDevice(req.params.deviceId, req.body);

    return res.json(apiResult('Request to device successfully', result));
  } catch (error) {
    next(error);
  }
});

module.exports = deviceController;

const apiResult = require('../../helpers/api-result.helper');
const AppService = require('./app.service');
const { imageUpload } = require('./multer.middleware');

const appController = require('express').Router();

appController.post('/image-upload', imageUpload.single('file'), async (req, res, next) => {
  try {
    const { file } = req;
    const appService = new AppService();
    if (file) {
      const result = await appService.uploadFileToFbStorage(file);

      res.json(apiResult('Image uploaded', result));
    } else {
      res.json(apiResult('No image uploaded'));
    }
  } catch (error) {
    next(error);
  }
});

module.exports = appController;

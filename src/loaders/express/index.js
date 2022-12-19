const express = require('express');
const cors = require('cors');

const constants = require('../../commons/constants');
const apiResult = require('../../helpers/api-result.helper');

const app = express();

// Setup middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Setup routes
const mainApi = express.Router();
mainApi.use('/auth', require('../../modules/auth/auth.controller'));
mainApi.use('/users', require('../../modules/users/user.controller'));
mainApi.use('/devices', require('../../modules/devices/device.controller'));

app.use('/api', mainApi);

// Error handler
app.use((err, req, res, next) => {
  if (err.message === constants.BAD_REQUEST) {
    return res.status(400).json(apiResult(err.message));
  } else if (err.message === constants.UNAUTHORIZED) {
    return res.status(401).json(apiResult(err.message));
  } else if (err.message === constants.NOT_FOUND) {
    return res.status(404).json(apiResult(err.message));
  }

  res.status(500).json(apiResult(constants.INTERNAL_SERVER_ERROR));

  return next();
});

module.exports = app;

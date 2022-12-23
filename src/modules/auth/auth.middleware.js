const jwt = require('jsonwebtoken');

const { MESSAGES } = require('../../commons/constants');
const configs = require('../../commons/configs');

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns
 */
module.exports = function authMiddleware(req, res, next) {
  const bearerToken = req.headers.authorization;
  if (!bearerToken) {
    return next(new Error(MESSAGES.UNAUTHORIZED));
  }

  const token = bearerToken.split(' ')[1];
  if (!token) {
    return next(new Error(MESSAGES.UNAUTHORIZED));
  }

  jwt.verify(token, configs.JWT_SECRET_KEY, async (err, decoded) => {
    if (err) {
      return next(new Error(MESSAGES.UNAUTHORIZED));
    }

    const { user } = decoded;
    if (!user?.id) {
      return next(new Error(MESSAGES.UNAUTHORIZED));
    }

    req.user = user;
    next();
  });
};

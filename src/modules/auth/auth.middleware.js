const { default: Container } = require('typedi');
const { MESSAGES, DI_KEYS } = require('../../commons/constants');

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns
 */
module.exports = function authMiddleware(req, res, next) {
  const bearerToken = req.headers.authorization;
  if (!bearerToken) {
    return next(new Error(MESSAGES.AUTHENTICATION_REQUIRED));
  }

  const token = bearerToken.split(' ')[1];
  if (!token) {
    return next(new Error(MESSAGES.AUTHENTICATION_REQUIRED));
  }

  /**
   * @type {import('firebase-admin').auth.Auth}
   */
  const fbAuth = Container.get(DI_KEYS.FB_AUTH);
  fbAuth
    .verifyIdToken(token)
    .then(decodedToken => {
      req.userId = decodedToken.uid;
      next();
    })
    .catch(error => {
      next(error);
    });
};

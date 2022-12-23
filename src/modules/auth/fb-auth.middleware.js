const { default: Container } = require('typedi');
const { MESSAGES, DI_KEYS } = require('../../commons/constants');

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns
 */
module.exports = function fbAuthMiddleware(req, res, next) {
  const bearerToken = req.headers.authorization;
  if (!bearerToken) {
    return next(new Error(MESSAGES.UNAUTHORIZED));
  }

  const token = bearerToken.split(' ')[1];
  if (!token) {
    return next(new Error(MESSAGES.UNAUTHORIZED));
  }

  /**
   * @type {import('firebase-admin').auth.Auth}
   */
  const fbAuth = Container.get(DI_KEYS.FB_AUTH);
  fbAuth
    .verifyIdToken(token)
    .then(decodedToken => {
      const user = { id: decodedToken.uid };
      req.user = user;
      next();
    })
    .catch(error => {
      console.log(error);
      next(new Error(MESSAGES.UNAUTHORIZED));
    });
};

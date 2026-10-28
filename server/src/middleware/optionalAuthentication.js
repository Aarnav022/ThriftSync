import { verifyToken } from '../modules/authentication/authService.js';
import User from '../modules/users/userModel.js';

export async function optionalAuthentication(req, res, next) {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return next();
    }

    const currentUser = await User.findById(decoded.id);
    if (currentUser && currentUser.isActive) {
      req.user = currentUser;
    }

    next();
  } catch (error) {
    next();
  }
}

export default optionalAuthentication;

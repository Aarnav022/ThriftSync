import { verifyToken } from '../modules/authentication/authService.js';
import User from '../modules/users/userModel.js';

export async function requireAuthentication(req, res, next) {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required. Please provide a valid Bearer token.',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid or expired authentication token. Please log in again.',
      });
    }

    const currentUser = await User.findById(decoded.id);
    if (!currentUser || !currentUser.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists or is inactive.',
      });
    }

    // Check if token version matches current user token version (session revocation on password change)
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== (currentUser.tokenVersion || 0)) {
      return res.status(401).json({
        status: 'fail',
        message: 'Session has expired due to a recent password change. Please log in again.',
      });
    }

    // Attach authenticated user to request object
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
}

export default requireAuthentication;

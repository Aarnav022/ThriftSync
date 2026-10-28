import User from './userModel.js';
import { signToken } from '../authentication/authService.js';

/**
 * Retrieves the currently authenticated user's profile.
 */
export async function handleGetMyProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User profile not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates the authenticated user's profile with strict user data isolation.
 */
export async function handleUpdateMyProfile(req, res, next) {
  try {
    // Strictly isolate modification to req.user._id only
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User profile not found',
      });
    }

    const { name, campus, avatar, phone, savedAddresses } = req.body;
    if (name !== undefined) user.name = name;
    if (campus !== undefined) user.campus = campus;
    if (avatar !== undefined) user.avatar = avatar;
    if (phone !== undefined) user.phone = phone;
    if (savedAddresses !== undefined) user.savedAddresses = savedAddresses;

    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves sanitized public profile of a campus peer (strips email, role, and private fields).
 */
export async function handleGetPublicProfile(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) {
      return res.status(404).json({
        status: 'fail',
        message: 'Campus student not found or inactive',
      });
    }

    // Return only safe public information
    const publicProfile = {
      _id: user._id,
      name: user.name,
      campus: user.campus,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      status: 'success',
      data: { user: publicProfile },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Changes password for authenticated user with current-password verification.
 */
export async function handleChangePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User profile not found',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        status: 'fail',
        message: 'Current password does not match.',
      });
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const freshToken = signToken(user);

    return res.status(200).json({
      status: 'success',
      message: 'Password updated successfully. All other active sessions have been revoked.',
      data: { token: freshToken },
    });
  } catch (error) {
    next(error);
  }
}

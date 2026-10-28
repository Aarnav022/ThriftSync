import jwt from 'jsonwebtoken';
import User from '../users/userModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'thriftsync-dev-fallback-secret-2026-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      tokenVersion: user.tokenVersion || 0,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function registerUser({ name, email, password, campus }) {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  // Strictly enforce student role on registration - never trust client input
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    campus: campus || 'Main Campus',
    role: 'student',
  });

  const token = signToken(user);
  return { user, token };
}

export async function loginUser(email, password) {
  // Query user and explicitly include password field for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = signToken(user);
  // Convert user to JSON object to remove password
  const userJson = user.toJSON();
  return { user: userJson, token };
}

export async function getUserProfile(userId) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    const error = new Error('User not found or inactive');
    error.statusCode = 404;
    throw error;
  }
  return user;
}

export default {
  signToken,
  verifyToken,
  registerUser,
  loginUser,
  getUserProfile,
};

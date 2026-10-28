import authService from './authService.js';

export async function register(req, res, next) {
  try {
    const { user, token } = await authService.registerUser(req.body);
    res.status(201).json({
      status: 'success',
      message: 'Account successfully registered',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser(email, password);
    res.status(200).json({
      status: 'success',
      message: 'Successfully authenticated',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function checkAdmin(req, res, next) {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Access granted: Verified administrator role.',
      data: {
        userId: req.user._id,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  register,
  login,
  getMe,
  checkAdmin,
};

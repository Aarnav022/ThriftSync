export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'fail',
      message: 'Access denied: Administrator privileges required.',
    });
  }
  next();
}

export default requireAdmin;

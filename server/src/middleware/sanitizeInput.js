/**
 * Sanitizes input to prevent NoSQL query operator injection and XSS.
 * Removes keys starting with '$' or containing '.' and strips script tags.
 */
function cleanObject(obj) {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      // Basic XSS tag stripping
      return obj.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '').trim();
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Strip MongoDB query operators ($gt, $ne, $where, etc.) and dot notation keys
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    cleaned[key] = cleanObject(value);
  }
  return cleaned;
}

export function sanitizeInput(req, res, next) {
  if (req.body) {
    req.body = cleanObject(req.body);
  }
  if (req.query) {
    req.query = cleanObject(req.query);
  }
  if (req.params) {
    req.params = cleanObject(req.params);
  }
  next();
}

export default sanitizeInput;

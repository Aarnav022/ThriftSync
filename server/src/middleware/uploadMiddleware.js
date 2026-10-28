import multer from 'multer';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.');
    error.statusCode = 400;
    cb(error, false);
  }
}

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
  fileFilter,
});

/**
 * Express middleware for single image uploads with clean Multer error handling.
 */
export function uploadSingleImage(req, res, next) {
  const handler = upload.single('image');

  handler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const error = new Error('Image exceeds maximum allowed size of 5MB');
        error.statusCode = 400;
        return next(error);
      }
      const error = new Error(`Upload error: ${err.message}`);
      error.statusCode = 400;
      return next(error);
    }
    if (err) {
      return next(err);
    }
    next();
  });
}

/**
 * Express middleware for multiple image uploads (max 5) with clean Multer error handling.
 */
export function uploadMultipleImages(req, res, next) {
  const handler = upload.array('images', 5);

  handler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const error = new Error('One or more images exceed the maximum allowed size of 5MB');
        error.statusCode = 400;
        return next(error);
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
        const error = new Error('Maximum 5 images allowed per upload');
        error.statusCode = 400;
        return next(error);
      }
      const error = new Error(`Upload error: ${err.message}`);
      error.statusCode = 400;
      return next(error);
    }
    if (err) {
      return next(err);
    }
    next();
  });
}

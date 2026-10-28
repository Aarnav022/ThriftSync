import { cloudinary, isCloudinaryConfigured } from '../../config/cloudinary.js';

/**
 * Uploads a single file buffer to Cloudinary with automatic optimization.
 * Falls back safely to localized base64 representation in local development or test environments.
 */
export async function uploadBufferToCloudinary(
  buffer,
  { folder = 'thriftsync/listings', mimetype = 'image/jpeg' } = {}
) {
  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) {
            const err = new Error(`Image storage upload failed: ${error.message}`);
            err.statusCode = 502;
            return reject(err);
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
          });
        }
      );
      stream.end(buffer);
    });
  }

  // Safe fallback for local development or testing without active Cloudinary keys
  const base64Data = buffer.toString('base64');
  const fallbackUrl = `data:${mimetype};base64,${base64Data}`;

  return {
    url: fallbackUrl,
    public_id: `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    format: mimetype.split('/')[1] || 'jpeg',
    isDevFallback: true,
  };
}

/**
 * Uploads an array of multer file objects.
 */
export async function uploadMultipleBuffers(files, options = {}) {
  const uploadPromises = files.map((file) =>
    uploadBufferToCloudinary(file.buffer, {
      ...options,
      mimetype: file.mimetype,
    })
  );

  return Promise.all(uploadPromises);
}

/**
 * Cloudinary / Image Storage Provider Configuration
 * Credentials must be supplied strictly via environment variables.
 */

export const imageStorageConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
  apiKey: process.env.CLOUDINARY_API_KEY || null,
  apiSecret: process.env.CLOUDINARY_API_SECRET || null,
  isConfigured: Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ),
};

export default imageStorageConfig;

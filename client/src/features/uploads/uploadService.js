import apiClient from '../../services/apiClient.js';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * Validate an image file before upload
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file format "${file.type || 'unknown'}". Supported formats: JPG, PNG, WebP, GIF.`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the 5MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }
  return { valid: true };
}

/**
 * Upload a single image
 * @param {File} file
 * @returns {Promise<{ url: string, publicId?: string }>}
 */
export async function uploadSingleImage(file) {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append('image', file);

  const res = await apiClient.post('/uploads/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
}

/**
 * Upload multiple images (up to 5)
 * @param {File[]} files
 * @returns {Promise<Array<{ url: string, publicId?: string }>>}
 */
export async function uploadMultipleImages(files) {
  if (!files || files.length === 0) {
    throw new Error('Please select at least one image to upload.');
  }
  if (files.length > 5) {
    throw new Error('You can upload a maximum of 5 images per listing.');
  }

  for (const file of files) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append('images', file);
  }

  const res = await apiClient.post('/uploads/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data.images;
}

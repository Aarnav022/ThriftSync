import express from 'express';
import { handleUploadSingle, handleUploadMultiple } from './uploadController.js';
import { uploadSingleImage, uploadMultipleImages } from '../../middleware/uploadMiddleware.js';
import requireAuthentication from '../../middleware/requireAuthentication.js';

const router = express.Router();

// All image upload operations strictly require an authenticated student session
router.use(requireAuthentication);

// Single image upload (e.g. avatar or single listing photo)
router.post('/image', uploadSingleImage, handleUploadSingle);

// Multiple image upload (max 5 photos for listing gallery)
router.post('/images', uploadMultipleImages, handleUploadMultiple);

export default router;

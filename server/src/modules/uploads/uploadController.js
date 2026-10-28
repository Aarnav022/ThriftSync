import * as uploadService from './uploadService.js';

export async function handleUploadSingle(req, res, next) {
  try {
    if (!req.file) {
      const error = new Error('No image file uploaded');
      error.statusCode = 400;
      throw error;
    }

    const result = await uploadService.uploadBufferToCloudinary(req.file.buffer, {
      mimetype: req.file.mimetype,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Image uploaded successfully',
      data: {
        url: result.url,
        public_id: result.public_id,
        isDevFallback: Boolean(result.isDevFallback),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleUploadMultiple(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      const error = new Error('No image files uploaded');
      error.statusCode = 400;
      throw error;
    }

    const results = await uploadService.uploadMultipleBuffers(req.files);
    const urls = results.map((r) => r.url);

    return res.status(201).json({
      status: 'success',
      message: `${results.length} images uploaded successfully`,
      data: {
        urls,
        items: results,
      },
    });
  } catch (error) {
    next(error);
  }
}

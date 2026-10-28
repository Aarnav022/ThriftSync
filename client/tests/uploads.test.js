import { describe, it, expect, vi } from 'vitest';
import {
  validateImageFile,
  uploadSingleImage,
  uploadMultipleImages,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from '../src/features/uploads/uploadService.js';
import apiClient from '../src/services/apiClient.js';

vi.mock('../src/services/apiClient.js', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('Cloudinary Image Upload Pipeline Verification', () => {
  it('validates supported image formats and file size limits', () => {
    // Valid JPEG under 5MB
    const validJpg = { name: 'textbook.jpg', type: 'image/jpeg', size: 1024 * 1024 };
    expect(validateImageFile(validJpg).valid).toBe(true);

    // Valid PNG under 5MB
    const validPng = { name: 'sweater.png', type: 'image/png', size: 2 * 1024 * 1024 };
    expect(validateImageFile(validPng).valid).toBe(true);

    // Valid WebP
    const validWebp = { name: 'calc.webp', type: 'image/webp', size: 500 * 1024 };
    expect(validateImageFile(validWebp).valid).toBe(true);

    // Rejected MIME: application/pdf
    const invalidPdf = { name: 'notes.pdf', type: 'application/pdf', size: 1024 };
    const pdfRes = validateImageFile(invalidPdf);
    expect(pdfRes.valid).toBe(false);
    expect(pdfRes.error).toContain('Invalid file format');

    // Rejected MIME: script or executable
    const invalidExe = { name: 'malware.sh', type: 'application/x-sh', size: 500 };
    expect(validateImageFile(invalidExe).valid).toBe(false);

    // Rejected size: exceeds 5MB
    const oversizedJpg = { name: 'huge.jpg', type: 'image/jpeg', size: 6 * 1024 * 1024 };
    const sizeRes = validateImageFile(oversizedJpg);
    expect(sizeRes.valid).toBe(false);
    expect(sizeRes.error).toContain('exceeds the 5MB size limit');
  });

  it('rejects uploads exceeding the maximum 5 images threshold', async () => {
    const dummyFiles = [
      { name: '1.jpg', type: 'image/jpeg', size: 100 },
      { name: '2.jpg', type: 'image/jpeg', size: 100 },
      { name: '3.jpg', type: 'image/jpeg', size: 100 },
      { name: '4.jpg', type: 'image/jpeg', size: 100 },
      { name: '5.jpg', type: 'image/jpeg', size: 100 },
      { name: '6.jpg', type: 'image/jpeg', size: 100 },
    ];

    await expect(uploadMultipleImages(dummyFiles)).rejects.toThrow(
      'You can upload a maximum of 5 images per listing.'
    );
  });

  it('rejects uploadMultipleImages when file list is empty', async () => {
    await expect(uploadMultipleImages([])).rejects.toThrow(
      'Please select at least one image to upload.'
    );
  });

  it('sends single image via multipart FormData to /uploads/image', async () => {
    const mockFile = new File(['mock content'], 'hoodie.jpg', { type: 'image/jpeg' });
    const mockResponse = {
      status: 'success',
      data: {
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        publicId: 'thriftsync/listings/sample',
      },
    };

    apiClient.post.mockResolvedValueOnce(mockResponse);

    const result = await uploadSingleImage(mockFile);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/uploads/image',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
    expect(result.url).toBe('https://res.cloudinary.com/demo/image/upload/sample.jpg');
  });

  it('sends multiple images via multipart FormData to /uploads/images', async () => {
    const mockFile1 = new File(['content 1'], 'front.jpg', { type: 'image/jpeg' });
    const mockFile2 = new File(['content 2'], 'back.jpg', { type: 'image/jpeg' });
    const mockResponse = {
      status: 'success',
      data: {
        images: [
          { url: 'https://res.cloudinary.com/demo/front.jpg' },
          { url: 'https://res.cloudinary.com/demo/back.jpg' },
        ],
      },
    };

    apiClient.post.mockResolvedValueOnce(mockResponse);

    const result = await uploadMultipleImages([mockFile1, mockFile2]);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/uploads/images',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
    expect(result).toHaveLength(2);
    expect(result[0].url).toBe('https://res.cloudinary.com/demo/front.jpg');
  });
});

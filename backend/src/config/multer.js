import multer from 'multer';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.has(file.mimetype)) {
    return cb(null, true);
  }

  const error = new Error('Only JPEG, PNG, and WebP images are allowed');
  error.statusCode = 400;
  return cb(error);
};

// Keep the original file in memory only until Sharp validates and normalizes it.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter,
});

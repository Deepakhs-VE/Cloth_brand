import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadsDirectory = path.resolve(__dirname, '../../uploads');

const allowedPurposes = new Set([
  'products',
  'categories',
  'testimonials',
  'branding',
  'general',
]);

const normalizePurpose = (purpose) =>
  allowedPurposes.has(purpose) ? purpose : 'general';

const optimizeImage = async (file) => {
  try {
    return await sharp(file.buffer, { failOn: 'warning' })
      .rotate()
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84, effort: 4 })
      .toBuffer();
  } catch (error) {
    const invalidImageError = new Error('The uploaded file is not a valid or supported image');
    invalidImageError.statusCode = 400;
    invalidImageError.cause = error;
    throw invalidImageError;
  }
};

const createImageKey = (purpose) =>
  `${normalizePurpose(purpose)}/${crypto.randomUUID()}.webp`;

const storeLocally = async (buffer, key) => {
  const [folder, filename] = key.split('/');
  const destination = path.join(uploadsDirectory, folder);
  const outputPath = path.join(destination, filename);

  await fs.mkdir(destination, { recursive: true });
  await fs.writeFile(outputPath, buffer, { flag: 'wx' });

  return {
    url: `/uploads/${folder}/${filename}`,
    key,
    provider: 'local',
  };
};

const storeOnS3 = async (buffer, key) => {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;

  if (!region || !bucket) {
    throw new Error('AWS_REGION and AWS_S3_BUCKET are required for S3 image storage');
  }

  // The default AWS credential chain is intentional: use an IAM role in
  // production, while local AWS profiles or environment keys remain supported.
  const client = new S3Client({ region });
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  const baseUrl = process.env.AWS_CDN_URL?.replace(/\/$/, '') ||
    `https://${bucket}.s3.${region}.amazonaws.com`;

  return {
    url: `${baseUrl}/${key}`,
    key,
    provider: 's3',
  };
};

export const storeImage = async (file, purpose = 'general') => {
  const provider = (process.env.IMAGE_STORAGE_PROVIDER || 'local').toLowerCase();
  const buffer = await optimizeImage(file);
  const key = createImageKey(purpose);

  if (provider === 'local') return storeLocally(buffer, key);
  if (provider === 's3') return storeOnS3(buffer, key);

  throw new Error(`Unsupported image storage provider: ${provider}`);
};

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimitMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { stripeWebhook } from './controllers/paymentController.js';
import { emailService } from './utils/emailService.js';
import { uploadsDirectory } from './services/imageStorageService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:3000',
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

// Stripe requires the original request body to verify webhook signatures.
// Keep the legacy payments path so existing Stripe dashboard endpoints continue
// working while /api/webhooks/stripe remains the canonical endpoint.
app.post(
  ['/api/webhooks/stripe', '/api/payments/webhook'],
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve uploaded static files
app.use('/uploads', express.static(uploadsDirectory, {
  fallthrough: false,
  immutable: true,
  maxAge: '30d',
}));

// Apply general API rate limiting
app.use('/api', apiLimiter);

// Health Check API
app.get('/api/health', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;

  res.status(200).json({
    status: databaseReady ? 'online' : 'degraded',
    database: databaseReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    brand: 'AURA Modern Luxury',
  });
});

// Do not run database-backed handlers while MongoDB is reconnecting. This
// produces a retryable 503 instead of a collection of misleading 500 errors.
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is temporarily unavailable. Please try again.',
    });
  }

  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    // Never accept requests until the initial database connection is ready.
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`[Server] Aura E-Commerce API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

      if (process.env.EMAIL_MODE !== 'log') {
        emailService.verifyConnection()
          .then(() => console.log('[Email] SMTP connection verified'))
          .catch((error) => console.error(`[Email Error] SMTP verification failed: ${error.message}`));
      }
    });
  } catch (error) {
    console.error('[Server] Startup aborted because the database is unavailable.');
    process.exitCode = 1;
  }
};

startServer();

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
});

export default app;

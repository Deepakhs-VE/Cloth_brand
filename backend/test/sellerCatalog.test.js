import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import sharp from 'sharp';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Seller } from '../src/models/Seller.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { SiteSettings } from '../src/models/SiteSettings.js';
import { generateAccessToken } from '../src/config/jwt.js';
import sellerRoutes from '../src/routes/sellerRoutes.js';
import productRoutes from '../src/routes/productRoutes.js';
import categoryRoutes from '../src/routes/categoryRoutes.js';
import uploadRoutes from '../src/routes/uploadRoutes.js';
import { errorHandler } from '../src/middleware/errorMiddleware.js';
import { uploadsDirectory } from '../src/services/imageStorageService.js';

dotenv.config();

test('seller catalog: ownership, approval, categories, variants and uploads', { timeout: 60000 }, async () => {
  assert.ok(process.env.MONGO_URI, 'Set MONGO_URI in backend/.env');
  // A separate database keeps store accounts and products out of the test.
  await mongoose.connect(process.env.MONGO_URI, { dbName: `aura_catalog_test_${randomUUID().replaceAll('-', '')}`, serverSelectionTimeoutMS: 10000 });
  const app = express();
  app.use(express.json());
  app.use('/api/sellers', sellerRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let uploadedFile;
  const previousProvider = process.env.IMAGE_STORAGE_PROVIDER;
  process.env.IMAGE_STORAGE_PROVIDER = 'local';
  try {
    await SiteSettings.create({});
    const users = await Promise.all(['seller', 'seller', 'seller', 'customer', 'admin'].map((role, index) => User.create({
      name: `Catalog Test ${index}`, email: `catalog${index}@example.com`, password: 'Test@123456', role,
    })));
    const sellers = await Promise.all(users.slice(0, 3).map((user, index) => Seller.create({
      user: user._id, storeName: `Test Store ${index}`, legalBusinessName: 'Test Business',
      supportEmail: user.email, supportPhone: '+353851234567', businessAddress: { countryCode: 'IE' },
      status: index === 2 ? 'PENDING' : 'APPROVED',
    })));
    const tokens = users.map((user) => generateAccessToken(user._id, user.role));
    async function request(user, method, url, body, expected = 200) {
      const response = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json',
        ...(user === null ? {} : { Authorization: `Bearer ${tokens[user]}` }) }, body: body ? JSON.stringify(body) : undefined });
      const data = await response.json();
      assert.equal(response.status, expected, `${method} ${url}: ${data.message}`);
      return data;
    }
    await request(null, 'GET', '/sellers/products', null, 401);
    await request(3, 'GET', '/sellers/products', null, 403);
    await request(2, 'GET', '/sellers/products', null, 403);
    await request(0, 'GET', '/products/admin', null, 403);
    await request(0, 'POST', '/categories', { name: 'Forbidden' }, 403);

    const category = (await request(0, 'POST', '/sellers/categories', { name: 'Seller Shirts', image: '/images/demo/shirts.jpg',
      createdBySeller: sellers[1]._id, displayOrder: -999 }, 201)).category;
    assert.equal(String(category.createdBySeller), String(sellers[0]._id));
    assert.equal(category.displayOrder, 0);
    await request(1, 'PUT', `/sellers/categories/${category._id}`, { name: 'Stolen' }, 404);
    await request(1, 'DELETE', `/sellers/categories/${category._id}`, null, 404);
    await request(1, 'POST', '/sellers/categories', { name: 'Foreign child', parent: category._id, image: '/image-placeholder.svg' }, 403);
    await request(0, 'PUT', `/sellers/categories/${category._id}`, { description: 'Updated by owner' });
    const allCategories = await request(1, 'GET', '/sellers/categories');
    assert.equal(allCategories.categories.find((entry) => entry._id === category._id).canManage, false);

    const product = (await request(0, 'POST', '/sellers/products', {
      name: 'Seller Test Shirt', description: 'Test shirt', images: ['/images/demo/shirts.jpg'],
      price: 40, discountPrice: 30, category: category._id, sku: 'SELLER-TEST',
      seller: sellers[1]._id, isFeatured: true,
      variants: [{ sku: 'SELLER-TEST-M', size: 'M', color: 'Navy', stock: 4 }],
    }, 201)).product;
    assert.equal(String(product.seller), String(sellers[0]._id));
    assert.equal(product.isFeatured, false);
    assert.equal(product.stock, 4);
    const ownProducts = await request(0, 'GET', '/sellers/products');
    assert.equal(ownProducts.total, 1);
    assert.equal((await request(1, 'GET', `/sellers/products?productId=${product._id}`)).total, 0);
    for (const [method, suffix, body] of [['PUT', '', { name: 'Stolen' }], ['DELETE', '', null], ['PATCH', '/toggle-status', null]]) {
      await request(1, method, `/sellers/products/${product._id}${suffix}`, body, 404);
    }
    await request(0, 'PUT', `/sellers/products/${product._id}`, { price: 45, discountPrice: 35,
      seller: sellers[1]._id, isFeatured: true, averageRating: 5,
      variants: [{ sku: 'SELLER-TEST-M', size: 'M', color: 'Navy', stock: 9 }],
    });
    const saved = await Product.findById(product._id);
    assert.equal(String(saved.seller), String(sellers[0]._id));
    assert.equal(saved.stock, 9);
    assert.equal(saved.isFeatured, false);
    assert.equal(saved.averageRating, 0);
    await request(0, 'DELETE', `/sellers/categories/${category._id}`, null, 400);
    await request(0, 'POST', '/sellers/categories', { name: 'Invalid child', parent: category._id, image: '/image-placeholder.svg' }, 400);
    const dashboard = await request(0, 'GET', '/sellers/dashboard');
    assert.equal(dashboard.stats.units, 9);
    assert.equal(dashboard.stats.products, 1);
    assert.equal((await request(1, 'GET', '/sellers/dashboard')).stats.products, 0);
    await request(0, 'PATCH', `/sellers/products/${product._id}/toggle-status`);
    assert.equal((await request(0, 'GET', '/sellers/products?status=inactive')).total, 1);

    const upload = new FormData();
    upload.append('purpose', 'products');
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } }).png().toBuffer();
    upload.append('image', new Blob([png], { type: 'image/png' }), 'test.png');
    const uploadResponse = await fetch(base + '/uploads', { method: 'POST', headers: { Authorization: `Bearer ${tokens[0]}` }, body: upload });
    const uploadData = await uploadResponse.json();
    assert.equal(uploadResponse.status, 201, uploadData.message);
    assert.ok(uploadData.url.startsWith('/uploads/products/'));
    uploadedFile = path.join(uploadsDirectory, uploadData.url.slice('/uploads/'.length));

    sellers[0].status = 'SUSPENDED';
    await sellers[0].save();
    await request(0, 'GET', '/sellers/products', null, 403);
    await request(0, 'PUT', `/sellers/products/${product._id}`, { price: 1 }, 403);
    await request(0, 'POST', '/uploads', {}, 403);
    sellers[0].status = 'APPROVED';
    await sellers[0].save();
    await request(0, 'DELETE', `/sellers/products/${product._id}`);
    await request(0, 'DELETE', `/sellers/categories/${category._id}`);
    // Existing admin catalog APIs continue to work.
    assert.equal((await request(4, 'GET', '/products/admin')).total, 0);
    await request(4, 'GET', '/categories/admin');
  } finally {
    if (uploadedFile) await unlink(uploadedFile);
    if (previousProvider === undefined) delete process.env.IMAGE_STORAGE_PROVIDER;
    else process.env.IMAGE_STORAGE_PROVIDER = previousProvider;
    await new Promise((resolve) => server.close(resolve));
    // Only fixtures in the uniquely named test database are removed.
    await Promise.all([Product, Category, Seller, User, SiteSettings].map((Model) => Model.deleteMany({})));
    await mongoose.disconnect();
  }
});

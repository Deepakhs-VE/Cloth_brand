import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { User } from '../models/User.js';
import { Seller } from '../models/Seller.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Address } from '../models/Address.js';
import { Cart } from '../models/Cart.js';
import { Wishlist } from '../models/Wishlist.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Review } from '../models/Review.js';
import { Coupon } from '../models/Coupon.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { Testimonial } from '../models/Testimonial.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { seedImage, repairSeedImages } from './seedImages.js';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
const dryRun = process.argv.includes('--dry-run');
const id = (key) => new mongoose.Types.ObjectId(createHash('sha256').update(`aura-demo-v1:${key}`).digest('hex').slice(0, 24));
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const day = 86400000;
const now = new Date();
const counts = {};
const documents = [];

// Stable IDs and insert-only writes make reruns safe for existing store data.
async function add(Model, key, data, lookup) {
  const document = new Model({ _id: id(key), ...data });
  await document.validate();
  counts[Model.modelName] = (counts[Model.modelName] || 0) + 1;
  documents.push(document);
  if (dryRun) return document;
  const existing = await Model.findOne(lookup ? { $or: [lookup, { _id: document._id }] } : { _id: document._id });
  if (existing) {
    repairSeedImages(existing, document);
    if (Model === Product && !existing.seller && document.seller && String(existing._id) === String(document._id)) {
      existing.seller = document.seller;
    }
    if (existing.isModified()) await existing.save();
    return existing;
  }
  return document.save();
}

async function seed() {
  const admin = await add(User, 'admin', {
    name: 'AURA Administrator', email: 'admin@aurastore.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123456', role: 'admin',
  }, { email: 'admin@aurastore.com' });
  const customers = [];
  const addresses = [];
  for (const [i, name] of ['Emma Wilson', 'Liam Murphy', 'Sophie Martin'].entries()) {
    const email = `customer${i + 1}@example.com`;
    const user = await add(User, `customer-${i}`, { name, email,
      password: process.env.SEED_CUSTOMER_PASSWORD || 'Customer@123456', role: 'customer', phone: '+353851234567',
    }, { email });
    customers.push(user);
    addresses.push(await add(Address, `address-${i}`, { user: user._id, fullName: name,
      phone: '+353851234567', streetAddress: `${10 + i} Sample Street`, city: 'Dublin',
      state: 'Dublin', postalCode: 'D02 X285', country: 'Ireland', countryCode: 'IE', isDefault: true,
    }));
  }
  const sellers = [];
  for (let i = 0; i < 2; i++) {
    const email = `seller${i + 1}@example.com`;
    const user = await add(User, `seller-user-${i}`, { name: ['Olivia Taylor', 'Noah Collins'][i],
      email, password: process.env.SEED_SELLER_PASSWORD || 'Seller@123456', role: 'seller',
    }, { email });
    sellers.push(await add(Seller, `seller-${i}`, { user: user._id, storeName: ['Linen House', 'Urban Threads'][i],
      legalBusinessName: ['Linen House Demo Ltd', 'Urban Threads Demo Ltd'][i], supportEmail: email,
      supportPhone: '+353851234567', businessAddress: { streetAddress: '12 Sample Street', city: 'Dublin',
        postalCode: 'D02 X285', countryCode: 'IE' }, status: 'APPROVED', reviewedAt: now,
    }, { user: user._id }));
  }

  const types = ['T-Shirts', 'Shirts', 'Jeans', 'Trousers', 'Knitwear', 'Jackets', 'Coats', 'Shorts', 'Activewear'];
  const products = [];
  for (const [a, audience] of ['women', 'men', 'girls', 'boys'].entries()) {
    for (const [t, type] of types.entries()) {
      const name = `${audience[0].toUpperCase() + audience.slice(1)} ${type}`;
      const category = await add(Category, `category-${a}-${t}`, { name, slug: slug(name), audience,
        description: `Explore comfortable, versatile ${type.toLowerCase()} for ${audience}.`,
        image: seedImage(type), displayOrder: a * types.length + t,
        defaultSizes: ['XS', 'S', 'M', 'L', 'XL'],
      }, { slug: slug(name) });
      for (let v = 0; v < 2; v++) {
        const n = products.length;
        const productName = `${v ? 'Signature' : 'Essential'} ${name}`;
        const price = 25 + t * 8 + v * 15;
        const sku = `DEMO-AURA-${String(n + 1).padStart(3, '0')}`;
        products.push(await add(Product, `product-${n}`, { name: productName, slug: slug(productName),
          description: `${productName} combines a comfortable regular fit with thoughtful everyday details. Soft fabric, durable seams and a versatile silhouette make it an easy wardrobe staple.`,
          shortDescription: `Everyday ${type.toLowerCase()} with a comfortable fit.`,
          category: category._id, seller: sellers[n % sellers.length]._id, audience, price, basePrice: price,
          discountPrice: v ? price - 5 : null, baseDiscountPrice: v ? price - 5 : null,
          images: [seedImage(type)], sku, isFeatured: n % 5 === 0,
          sizeSystem: 'alpha', fit: 'regular', fabric: 'Cotton blend', garmentType: type,
          colorOptions: [{ name: 'Navy', hex: '#1E293B' }, { name: 'Cream', hex: '#FFFDD0' }],
          variants: ['Navy', 'Cream'].flatMap((color) => ['XS', 'S', 'M', 'L', 'XL'].map((size) => ({
            sku: `${sku}-${color.toUpperCase()}-${size}`, color, size, stock: 8, price,
            discountPrice: v ? price - 5 : null,
          }))),
          tags: [audience, type.toLowerCase(), v ? 'signature' : 'essentials'],
          fashionDetails: { brandName: 'AURA', pattern: 'Solid', occasion: 'Casual',
            materialComposition: '95% cotton, 5% elastane', careInstructions: 'Machine wash cold with similar colours.' },
          specifications: [{ key: 'Collection', value: v ? 'Signature' : 'Essentials' }],
          commerce: { currency: 'EUR', vatRate: 20, vatIncluded: true, weightGrams: 350 },
        }, { slug: slug(productName) }));
      }
    }
  }

  const stages = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  for (let i = 0; i < 12; i++) {
    const user = customers[i % 3];
    const product = products[i];
    const variant = product.variants.find((entry) => entry.size === 'M');
    const price = variant.discountPrice ?? variant.price ?? product.discountPrice ?? product.price;
    const quantity = 1 + i % 2;
    const subtotal = price * quantity;
    const shippingAmount = subtotal >= 150 ? 0 : 15;
    const totalAmount = subtotal + shippingAmount;
    const orderStatus = stages[i % stages.length];
    const paid = orderStatus !== 'PENDING';
    const createdAt = new Date(now.getTime() - (20 - i) * day);
    const shippingAddress = addresses[i % 3].toObject();
    delete shippingAddress._id;
    const orderNumber = `DEMO-AURA-${String(i + 1).padStart(5, '0')}`;
    const order = await add(Order, `order-${i}`, { orderNumber, user: user._id,
      orderItems: [{ product: product._id, name: product.name, slug: product.slug, image: product.images[0],
        price, quantity, total: subtotal, selectedSize: variant.size, selectedColor: variant.color, variantSku: variant.sku }],
      shippingAddress, subtotal, shippingAmount, totalAmount,
      taxAmount: Math.round(subtotal / 6 * 100) / 100, pricesIncludeVat: true,
      orderStatus, paymentStatus: paid ? 'PAID' : 'PENDING', isPaid: paid,
      paidAt: paid ? createdAt : undefined, isDelivered: orderStatus === 'DELIVERED',
      deliveredAt: orderStatus === 'DELIVERED' ? new Date(now.getTime() - day) : undefined,
      statusHistory: stages.slice(0, stages.indexOf(orderStatus) + 1).map((status, index) => ({
        status, note: 'Demo seed order', updatedAt: new Date(createdAt.getTime() + index * 3600000),
      })), createdAt,
      carrier: stages.indexOf(orderStatus) >= 3 ? 'Demo Courier' : '',
      trackingNumber: stages.indexOf(orderStatus) >= 3 ? `DEMO-TRACK-${i + 1}` : '',
    }, { orderNumber });
    await add(Payment, `payment-${i}`, { order: order._id, user: user._id, amount: totalAmount,
      transactionId: `demo_transaction_${i + 1}`, paymentStatus: paid ? 'SUCCESS' : 'PENDING',
      gatewayResponse: { demo: true, message: 'Synthetic payment; no gateway transaction or charge.' }, createdAt,
    });
    if (orderStatus === 'DELIVERED') {
      await add(Review, `review-${i}`, { user: user._id, product: product._id, rating: 5,
        comment: 'Comfortable fit and lovely fabric. Very happy with this purchase.',
        isVerifiedPurchase: true, fitFeedback: 'true_to_size', qualityRating: 5,
      }, { user: user._id, product: product._id });
      if (!dryRun) await Review.calcAverageRatings(product._id);
    }
  }
  for (const [i, user] of customers.entries()) {
    const product = products[30 + i];
    const variant = product.variants[0];
    await add(Cart, `cart-${i}`, { user: user._id, items: [{ product: product._id, quantity: 1,
      selectedSize: variant.size, selectedColor: variant.color, variantSku: variant.sku }] }, { user: user._id });
    await add(Wishlist, `wishlist-${i}`, { user: user._id, products: products.slice(40 + i, 43 + i).map((p) => p._id) }, { user: user._id });
    await add(Testimonial, `testimonial-${i}`, { clientName: user.name, rating: 5,
      reviewText: 'Beautiful everyday pieces, comfortable fabrics and a smooth shopping experience.', displayOrder: i });
    await add(ContactMessage, `contact-${i}`, { name: user.name, email: user.email,
      subject: ['Sizing advice', 'Delivery information', 'Exchange information'][i],
      message: 'This is a demo enquiry to preview customer support management.', status: ['NEW', 'IN_PROGRESS', 'RESOLVED'][i] });
  }
  for (const [code, discountValue] of [['WELCOME10', 10], ['LUXE2026', 35], ['AURA15', 15]]) {
    await add(Coupon, `coupon-${code}`, { code, discountType: 'percentage', discountValue,
      minOrderAmount: 50, maxDiscountAmount: 75, startDate: new Date(now.getTime() - day),
      endDate: new Date(now.getTime() + 90 * day), description: 'Demo store promotion' }, { code });
  }
  await add(SiteSettings, 'settings', { brandName: 'AURA',
    hero: { badge: 'New Season Collection', title: 'Everyday style, thoughtfully crafted',
      subtitle: 'Explore versatile clothing for women, men and kids.', imageUrl: seedImage('Jackets') },
    aboutUs: { imageUrl: seedImage('Knitwear') },
  }, {});
  if (dryRun) {
    const ids = new Set(documents.map((document) => String(document._id)));
    for (const document of documents) {
      for (const field of ['user', 'category', 'product', 'order']) {
        if (document[field] && !ids.has(String(document[field]))) throw new Error(`Missing reference: ${document.constructor.modelName}.${field}`);
      }
    }
  }
  console.log(`${dryRun ? 'Validated' : 'Seed complete (existing records preserved)'}:`, JSON.stringify(counts));
  console.log('Demo accounts: admin@aurastore.com; customer1@example.com through customer3@example.com; seller1@example.com and seller2@example.com.');
}

try {
  if (!dryRun) {
    if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI in backend/.env before seeding.');
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
    console.log(`Seeding database: ${mongoose.connection.name}`);
  }
  await seed();
} catch (error) {
  // Avoid logging connection strings or credentials from driver errors.
  console.error(`Seed failed (${error.name}${error.code ? `, code ${error.code}` : ''}). ${error instanceof mongoose.Error.ValidationError ? error.message : error.code === 11000 ? `Duplicate ${Object.keys(error.keyPattern || error.keyValue || {}).join(', ')}. Check existing records and indexes.` : 'Check database connectivity and configuration.'}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

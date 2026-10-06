# AURA — Modern Luxury E-Commerce & Brand Platform

A production-ready, full-stack e-commerce and business website architecture built with **React.js**, **Node.js**, **Express.js**, and **MongoDB**.

---

## 🌟 Architecture & Highlights

- **100% Dynamic Business Data**: All products, categories, prices, offers, testimonials, reviews, inquiries, users, and site configurations are stored and fetched dynamically from MongoDB.
- **Enterprise Authentication & RBAC**: JWT Access & Refresh Token architecture with bcrypt password hashing, token expiration, and role-based access control (`customer` and `admin`).
- **Server-Side Price & Inventory Integrity**: The shopping cart and checkout recalculate all totals from the MongoDB database to prevent frontend tampering.
- **Inventory & Stock Management**: Stock counts are validated before checkout, automatically reduced upon order confirmation, and restored upon cancellation.
- **Comprehensive Admin Console**: Live KPI metric cards (revenue, orders, users, low stock warnings), product CRUD, category CRUD, order tracking status management, user role moderation, coupon management, review approval, testimonial editor, and brand settings.
- **Promotional Coupons**: Percentage and fixed discount coupons with minimum spend thresholds, usage limits, and per-user limits.
- **Verified Reviews**: Star ratings (1-5), verified purchase verification badges, and admin moderation workflow.
- **Mobile-Responsive Luxury UI**: Tailored typography (Cinzel & Inter), slide-out shopping bag drawer, search modal, floating WhatsApp concierge trigger, and responsive mobile navigation.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v22.9.0)
- **MongoDB**: Running locally at `mongodb://127.0.0.1:27017` or configured via `MONGO_URI` in `.env`

### 2. Backend Setup
```bash
cd backend
npm install
npm run seed     # Populates initial dynamic business data & accounts
npm run dev      # Runs API server on http://localhost:5000 (watch mode)
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev      # Runs Vite dev server on http://localhost:5173
```

---

## 🔑 Pre-Seeded Accounts

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@aurastore.com` | `Admin@123456` | Full Admin Console & Storefront |
| **Customer** | `customer@aurastore.com` | `Customer@123456` | Shopping, Wishlist, Checkout, Orders |

*Note: The login page includes convenient 1-click **Quick-Fill** buttons for instant testing.*

---

## 🎟️ Active Demo Promotional Codes

| Code | Type | Value | Condition |
|---|---|---|---|
| `LUXE2026` | Percentage | **20% OFF** | Min. Order $100 |
| `FIRST10` | Percentage | **10% OFF** | Min. Order $50 |
| `SPRING50` | Fixed | **$50 OFF** | Min. Order $250 |

---

## 📁 Project Directory Structure

```
aura-ecommerce/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, JWT, Multer file upload configs
│   │   ├── controllers/     # Auth, User, Product, Category, Cart, Order, Payment, Coupon, Review, Testimonial, Contact, Settings, Admin
│   │   ├── middleware/      # Auth protect & authorize, Rate limiting, Error handlers
│   │   ├── models/          # 13 Mongoose schemas (User, Product, Category, Cart, Wishlist, Address, Order, Payment, Coupon, Review, Testimonial, ContactMessage, SiteSettings)
│   │   ├── routes/          # RESTful Express route definitions
│   │   ├── utils/           # Database seeder, Email service templates, slugify
│   │   └── server.js        # Express app entry point
│   ├── uploads/             # Media storage
│   ├── .env                 # Environment variables
│   └── package.json
│
├── frontend/
│   ├── public/              # Favicon, robots.txt, sitemap.xml
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/       # Admin sidebar & layout
│   │   │   ├── common/      # ProductCard, StarRating, Badges, Modals, Pagination, EmptyState
│   │   │   ├── home/        # HeroSection, FeaturesBar, Categories, FeaturedProducts, SpecialOffer, AboutPreview, Testimonials
│   │   │   ├── layout/      # Navbar, Footer, CartDrawer, FloatingWhatsApp, ProtectedRoute, AdminRoute
│   │   │   └── products/    # ProductFilters, sorting
│   │   ├── context/         # AuthContext, CartContext, WishlistContext, SettingsContext
│   │   ├── pages/           # Public & Customer pages (Home, Products, Detail, Offers, About, Contact, Policies, Login, Register, Cart, Checkout, Success, Orders, Detail, Addresses, Wishlist, Profile)
│   │   │   └── admin/       # 10 Admin management dashboards
│   │   ├── services/        # Axios API client with automatic JWT bearer & refresh interceptors
│   │   ├── App.jsx          # Route hierarchy
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 🔒 Security & Performance Features

- **Passwords**: Hashed with `bcryptjs` salt rounds.
- **JWT Protection**: Access tokens (short-lived) + Refresh tokens (persisted in DB).
- **HTTP Security**: `helmet` headers enabled.
- **DDoS / Brute-force**: `express-rate-limit` on auth and public endpoints.
- **CORS**: Domain whitelisting with credentials support.
- **MongoDB Indexes**: Text search indexing on product catalog, compound index on categories and coupons.
- **Stock Validation**: Concurrency-safe decrementing on order placement with rollback on cancellation.

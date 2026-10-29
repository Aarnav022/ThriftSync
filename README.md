# ThriftSync (ThriftSyn) 🌿📦

> **Production-Grade Sustainable Campus Exchange & Marketplace**  
> Inspired by Amazon's high-density UI/UX architecture and conversion flow, reimagined with a **Sustainable Forest & Terracotta** aesthetic. Built for college campuses and local communities to buy, sell, rent, swap, and upcycle secondhand textbooks, fashion, electronics, and dorm living essentials.

---

## 🌟 Key Capabilities & Features

1. **Amazon-Inspired Density & Layout:**
   - Multi-tier Navigation (`#122620` Deep Forest Charcoal) with campus location selector, search bar with category filtering, and live Cart counter.
   - Secondary Sub-Navigation (`#1D3B32` Muted Botanical Green) linking to all campus departments.
   - Amazon-style Hero Banner carousel with gradient bottom fade overlapping 4-grid Quad Cards.
   - 3-Column Product Detail Page with sticky image gallery, specification breakdown, and sticky Right Buy Box.
   - 2-Column Shopping Cart supporting **both direct purchases and rentals with security deposits**.
   - 3-Step Accordion Checkout (Campus Meetup Location, Flexible Payment, Order Review).
2. **Campus-Specific Functionality:**
   - **Buy vs. Rent Selector:** Rent textbooks or formal wear for 3, 7, 14, or 30 days with automated daily rate & refundable security deposit calculations.
   - **Condition Badges:** Clear verification tags (*Like New*, *Good/Excellent*, *Fair*).
   - **Campus Zone Meetup Points:** Hostels, Campus Hubs, Central Library, and Sports Complex.
   - **Student Seller Mode (`/sell`):** One-click listing uploads with instant inventory table and status tracking.
   - **Order Lifecycle Tracking (`/orders`):** Live timeline (`PLACED` → `PACKED` → `HANDED_OVER` → `COMPLETED`) with handover confirmation.
   - **Peer Reviews (`/product/:id`):** Real student reviews with 5-to-1 star percentage distribution.
   - **Admin Moderation Portal (`/admin`):** Protected dashboard for campus administrators to review listings, update order fulfillments, and manage user accounts.

---

## 🎨 Design System & Palette Tokens

| Element | Color Hex | Role |
| :--- | :--- | :--- |
| **Primary Header** | `#122620` | Deep Forest Charcoal |
| **Secondary Sub-Navbar** | `#1D3B32` | Muted Botanical Green |
| **Canvas Background** | `#F6F5F0` | Warm Alabaster |
| **Card / Surface** | `#FFFFFF` | Pure White (`#E6E4DD` border) |
| **Primary CTA** | `#E07A5F` | Warm Terracotta (`#C86449` hover) |
| **Secondary CTA** | `#1D3B32` | Forest Slate (`#122620` hover) |
| **Links & Badges** | `#2A6F4E` | Botanical Green |
| **Ratings & Highlights** | `#D97706` | Warm Amber Gold |
| **Deals / Discounts** | `#B91C1C` | Deep Brick Red |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or remote MongoDB URI)

### 1. Server Setup & Database Seeding
```bash
cd thriftsync/server

# Install dependencies (already completed)
npm install

# Configure environment variables (set ADMIN_PASSWORD, JWT_SECRET, etc.)
cp .env.example .env

# Seed database with campus store data and administrator account
npm run seed

# Run Backend Unit Tests (15 test suites)
npm test

# Start the Express API server (Runs on port 5000)
npm run dev
```

### 2. Client Setup & Development Server
```bash
cd thriftsync/client

# Install dependencies (already completed)
npm install

# Production build check
npm run build

# Start Vite React development server (Runs on http://localhost:5173)
npm run dev
```

---

## 🔑 Initial Administrator Account

The platform administrator account is provisioned dynamically via environment variables configured in `server/.env` (0 demo student/seller users seeded; real buyers and sellers register live via `/register`):

| Role | Email | Password | Provisioning Method |
| :--- | :--- | :--- | :--- |
| **System Administrator** | Configured in `ADMIN_EMAIL` (default: `admin@thriftsync.campus`) | Configured in `ADMIN_PASSWORD` (`.env`) | `npm run seed` or `npm run seed:admin` |

> **Security Note:** Default credentials are never stored in source control or published documentation. If an active database or deployment previously used the deprecated published password, administrator credential rotation must be performed separately (e.g., by setting a new `ADMIN_PASSWORD` and `ADMIN_FORCE_PASSWORD_RESET=true` with `npm run seed:admin`).

---

## 🗺️ Application Routing

| Route | Page | Description |
| :--- | :--- | :--- |
| `/` | **Storefront (Buyer)** | Hero carousel, 4-grid category cards, Today's Deals & Semester Rentals carousels. |
| `/products` | **Product Catalog** | Filter sidebar (Category, Condition, Type, Zone, Student Budget, Stock) + sorting. |
| `/product/:id` | **Product Detail** | Multi-image zoom, Buy vs Rent selector, Right Sticky Buy Box, Student reviews. |
| `/cart` | **Shopping Cart** | 2-column cart with purchase vs rental fee breakdown, deposit calculation. |
| `/checkout` | **Checkout** | 3-step accordion: Meetup point, Payment method, Order summary & confirmation. |
| `/orders` | **Orders & Handover** | Real-time personal purchase/rental progress tracking & handover confirmation. |
| `/seller` | **Seller Hub** | Dedicated 3-tab Seller Dashboard (My Inventory, Add Listing, Incoming Orders). |
| `/profile` | **Student Profile** | Profile details, saved campus delivery locations, and Wishlist management. |
| `/admin` | **Admin Dashboard** | Protected analytics cards, listing moderation, and order status fulfillment. |
| `/admin/login` | **Admin Portal Login** | Direct administration sign-in route with admin role enforcement. |
| `/login` & `/register` | **Authentication** | Production-ready clean authentication with Buyer, Seller, and Admin mode selection. |

---

## 🧪 Verification & Test Coverage

The backend includes a comprehensive Vitest suite covering 14 modules:
- ✅ `swaps.test.js`
- ✅ `rentals.test.js`
- ✅ `security.test.js` (bcrypt hashing, JWT tokens, sanitization)
- ✅ `listings.test.js` (validation, authorization, pagination)
- ✅ `orders.test.js` (idempotency, concurrency guard, stock deduction)
- ✅ `moneypath.test.js` (checkout calculations, COD limits)
- ✅ `reviews.test.js` (trust metrics, peer ratings)
- ✅ `auth.test.js` (registration, login, role-based access)
- ✅ `uploads.test.js` (file size, MIME types, Cloudinary storage pipeline)
- ✅ `notifications.test.js`
- ✅ `smoke.test.js`
- ✅ `users.test.js`
- ✅ `database.test.js`
- ✅ `admin-seed.test.js`

**Result:** **14 passed (14)**, **155 passed (155)**.

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../modules/users/userModel.js';
import Listing from '../modules/listings/listingModel.js';
import Order from '../modules/orders/orderModel.js';
import Review from '../modules/reviews/reviewModel.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';

export async function runSeed() {
  console.log('[Seed] Connecting to MongoDB...');
  await connectDatabase();

  try {
    console.log('[Seed] Clearing all existing data for clean production slate...');
    try {
      await mongoose.connection.collection('orders').dropIndexes();
    } catch (e) {
      // ignore index drop errors if collection doesn't exist
    }

    await Promise.all([
      User.deleteMany({}),
      Listing.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
    ]);

    // 1. Robustly provision the master system admin account (Zero demo students or sellers)
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@thriftsync.campus').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('[Seed] Error: ADMIN_PASSWORD environment variable is required to provision the administrator.');
      process.exitCode = 1;
      return;
    }
    if (adminPassword.length < 8) {
      console.error('[Seed] Error: ADMIN_PASSWORD must be at least 8 characters long.');
      process.exitCode = 1;
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const adminHashedPassword = await bcrypt.hash(adminPassword, salt);

    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: process.env.ADMIN_NAME || 'Campus Administrator',
        email: adminEmail,
        password: adminHashedPassword,
        role: 'admin',
        campus: process.env.ADMIN_CAMPUS || 'Central Administration',
        isActive: true,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      });
      console.log(`[Seed] Provisioned Master System Administrator: ${adminEmail} (role: admin)`);
    } else {
      adminUser.role = 'admin';
      adminUser.password = adminHashedPassword;
      adminUser.isActive = true;
      adminUser.name = process.env.ADMIN_NAME || adminUser.name || 'Campus Administrator';
      adminUser.campus = process.env.ADMIN_CAMPUS || adminUser.campus || 'Central Administration';
      await adminUser.save();
      console.log(`[Seed] Master System Administrator verified & updated: ${adminEmail} (role: admin)`);
    }

    console.log('[Seed] Master Admin Account ready. Zero demo students or sellers seeded.');

    // 2. Assign 6 Realistic Low-Price Campus Thrift Items to the Campus Administration Store Inventory
    const listingsData = [
      {
        title: 'Data Structures & Algorithms Notes + Textbook',
        description: 'Complete DSA notes with solved semester exam problems and core reference book. Clean pages with minimal pencil highlights. Essential for CS students.',
        category: 'Textbooks',
        condition: 'Good',
        listingType: 'buy_and_rent',
        price: 180,
        pricePaise: 18000,
        rentalRate: 15,
        rentalPeriod: 'per day',
        deposit: 60,
        totalStock: 3,
        availableStock: 3,
        campus: 'North Campus Hub',
        pickupLocation: 'Central Library Steps',
        images: [
          'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=800&q=80'
        ],
        seller: adminUser._id,
        status: 'active',
      },
      {
        title: 'Higher Engineering Mathematics (Semester Reference Book)',
        description: 'Used for 1 semester in Math-I & Math-II. No torn pages, clean margins, and sturdy bound spine in great condition.',
        category: 'Textbooks',
        condition: 'Like New',
        listingType: 'buy_and_rent',
        price: 120,
        pricePaise: 12000,
        rentalRate: 10,
        rentalPeriod: 'per day',
        deposit: 50,
        totalStock: 2,
        availableStock: 2,
        campus: 'North Campus Hub',
        pickupLocation: 'Engineering Dept Cafeteria',
        images: [
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80'
        ],
        seller: adminUser._id,
        status: 'active',
      },
      {
        title: 'Vintage Oversized Flannel Plaid Shirt (Size M/L)',
        description: 'Warm brushed cotton thrifted flannel shirt in forest green and brown checks. Washed, sanitized, and ready for campus mornings.',
        category: 'Fashion',
        condition: 'Good',
        listingType: 'buy_and_rent',
        price: 250,
        pricePaise: 25000,
        rentalRate: 20,
        rentalPeriod: 'per day',
        deposit: 80,
        totalStock: 2,
        availableStock: 2,
        campus: 'South Campus Hostel 4',
        pickupLocation: 'Hostel 4 Common Room',
        images: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80'
        ],
        seller: adminUser._id,
        status: 'active',
      },
      {
        title: 'Campus Graphic Fleece Hoodie (Charcoal, Size L)',
        description: 'Super soft oversized fleece hoodie with minimalist campus typography. Worn twice, practically brand new with zero stains or fraying.',
        category: 'Fashion',
        condition: 'Like New',
        listingType: 'buy',
        price: 350,
        pricePaise: 35000,
        totalStock: 2,
        availableStock: 2,
        campus: 'North Campus Hub',
        pickupLocation: 'Student Center Hub',
        images: [
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80'
        ],
        seller: adminUser._id,
        status: 'active',
      },
      {
        title: 'Upcycled Denim Campus Tote Bag with Inner Pocket',
        description: 'Handcrafted durable tote bag made from sturdy reclaimed denim. Easily carries a 15-inch laptop, spiral notebooks, and everyday college gear.',
        category: 'Dorm & Living',
        condition: 'Like New',
        listingType: 'buy',
        price: 150,
        pricePaise: 15000,
        totalStock: 4,
        availableStock: 4,
        campus: 'South Campus Hostel 4',
        pickupLocation: 'Design Studio Quad',
        images: [
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80'
        ],
        seller: adminUser._id,
        status: 'active',
      },
      {
        title: 'Adjustable LED Study Desk Lamp (Warm/White Light)',
        description: 'USB-powered flexible gooseneck study lamp with 3 brightness modes. Perfect for late-night hostel study sessions without disturbing roommates.',
        category: 'Electronics',
        condition: 'Good',
        listingType: 'buy_and_rent',
        price: 299,
        pricePaise: 29900,
        rentalRate: 15,
        rentalPeriod: 'per day',
        deposit: 70,
        totalStock: 3,
        availableStock: 3,
        campus: 'North Campus Hub',
        pickupLocation: 'Hostel 3 Gate',
        images: [
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80'
        ],
        seller: adminUser._id,
        status: 'active',
      },
    ];

    const createdListings = await Listing.insertMany(listingsData);
    console.log(`[Seed] Seeded ${createdListings.length} realistic student thrift listings under Campus Administration store.`);
    console.log('[Seed] Clean slate verified: 0 demo students, 0 demo sellers, 0 fake orders.');
    return true;
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    throw err;
  } finally {
    await disconnectDatabase();
    console.log('[Seed] Disconnected from MongoDB.');
  }
}

// Auto-run if executed directly as a script
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed().catch(() => process.exit(1));
}

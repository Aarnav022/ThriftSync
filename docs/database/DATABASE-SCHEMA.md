# ThriftSync — Database Schema Specification

This document defines the authoritative MongoDB collections, schemas, indexes, and validation rules for ThriftSync.

---

## 1. Overview & Connection Architecture

- **Engine:** MongoDB Server 6.0+ via Mongoose 8.x
- **Development URI:** `mongodb://127.0.0.1:27017/thriftsync_dev`
- **Configuration Module:** [`server/src/config/database.js`](file:///F:/Arnab/thriftsync/server/src/config/database.js)
- **Design Rules:**
  - Strict input sanitization and schema-level validation.
  - Password hashes must never be exposed or returned in query results (`select: false` and `toJSON` stripping).
  - Track rental charges and refundable deposits separately.
  - Prevent conflicting purchases and rentals through distinct status transitions.

---

## 2. Collections

### 2.1 `users` Collection
Stores registered campus community members and administrators.

| Field | Type | Required | Unique | Default | Description |
|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Yes | | Primary key |
| `name` | String | Yes | No | | Full name (2–100 chars, trimmed) |
| `email` | String | Yes | Yes | | Normalized lowercase campus email |
| `password` | String | Yes | No | | Hashed password (bcrypt, 10 rounds, `select: false`) |
| `role` | String | Yes | No | `'student'` | Enum: `['student', 'admin']` (enforced server-side) |
| `campus` | String | No | No | `'Main Campus'` | Campus or residential quad |
| `avatar` | String | No | No | `null` | URL or asset path to profile photo |
| `isActive` | Boolean | Yes | No | `true` | Account moderation/activation status |
| `createdAt` | Date | Auto | No | Current timestamp | Timestamp of registration |
| `updatedAt` | Date | Auto | No | Current timestamp | Timestamp of last profile update |

**Indexes:**
- `{ email: 1 }` (Unique)

---

### 2.2 `listings` Collection
Stores pre-owned textbook, garment, electronics, and dorm gear listings.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Auto | | Primary key |
| `title` | String | Yes | | Title (3–120 chars, trimmed) |
| `description` | String | Yes | | Detailed condition and specifics (10–2000 chars) |
| `category` | String | Yes | | Enum: `['Textbooks', 'Fashion', 'Electronics', 'Dorm & Living', 'Other']` |
| `condition` | String | Yes | | Enum: `['Like New', 'Excellent', 'Good', 'Fair']` |
| `listingType` | String | Yes | `'buy'` | Enum: `['buy', 'rent', 'swap', 'buy_and_rent']` |
| `price` | Number | Conditional | `null` | Outright purchase price in USD (required if `buy` or `buy_and_rent`) |
| `rentalRate` | Number | Conditional | `null` | Rental charge in USD (required if `rent` or `buy_and_rent`) |
| `rentalPeriod` | String | No | `'per semester'` | Enum: `['per day', 'per week', 'per month', 'per semester']` |
| `deposit` | Number | No | `0` | Refundable security deposit (tracked separately from rental charge) |
| `swapFor` | String | Conditional | `null` | Item sought in exchange (required if `listingType: 'swap'`) |
| `campus` | String | No | `'Main Campus'` | Designated campus / area |
| `pickupLocation` | String | No | `'Campus Student Center'` | Verified on-campus exchange location |
| `images` | Array[String] | No | `[]` | Array of image URLs |
| `seller` | ObjectId | Yes | | Reference to `users._id` |
| `status` | String | Yes | `'active'` | Enum: `['active', 'reserved', 'rented', 'sold', 'archived']` |
| `createdAt` | Date | Auto | Current timestamp | Creation timestamp |
| `updatedAt` | Date | Auto | Current timestamp | Last update timestamp |

**Indexes:**
- `{ status: 1, category: 1, createdAt: -1 }` (Catalog browsing)
- `{ status: 1, listingType: 1, createdAt: -1 }` (Listing type filtering)
- `{ seller: 1 }` (User's listing dashboard)
- `{ title: 'text', description: 'text' }` (Full-text search)

---

### 2.3 `swaps` Collection
Stores peer-to-peer circular exchange proposals, counter-offer history, and bilateral handover confirmations.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Auto | | Primary key |
| `proposer` | ObjectId | Yes | | Foreign reference to initiating student (`users._id`) |
| `recipient` | ObjectId | Yes | | Foreign reference to target item owner (`users._id`) |
| `offeredListing` | ObjectId | Yes | | Listing offered by proposer (`listings._id`) |
| `requestedListing` | ObjectId | Yes | | Listing requested from recipient (`listings._id`) |
| `initialMessage` | String | No | `''` | Proposal message (max 1000 chars) |
| `status` | String | Yes | `'PENDING'` | Enum: `['PENDING', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'COMPLETED', 'CANCELLED']` |
| `currentTurn` | ObjectId | Yes | | Foreign reference to user whose turn it is to act (`users._id`) |
| `counterOffers` | Array[Object] | No | `[]` | Embedded array of counter-offers: `{ sender, recipient, offeredListing, requestedListing, message, createdAt }` |
| `handoverConfirmations` | Object | Yes | | `{ proposerConfirmed, proposerConfirmedAt, recipientConfirmed, recipientConfirmedAt }` |
| `rejectionReason` | String | No | `null` | Reason provided upon rejection |
| `cancellationReason` | String | No | `null` | Reason provided upon cancellation of accepted exchange |
| `timeline` | Array[Object] | No | `[]` | Embedded audit trail: `{ action, actor, note, timestamp }` |
| `createdAt` | Date | Auto | Current timestamp | Creation timestamp |
| `updatedAt` | Date | Auto | Current timestamp | Last update timestamp |

**Indexes:**
- `{ proposer: 1, status: 1, createdAt: -1 }` (Proposer active queries)
- `{ recipient: 1, status: 1, createdAt: -1 }` (Recipient inbox queries)
- `{ offeredListing: 1, requestedListing: 1, status: 1 }` (Duplicate prevention)

---

### 2.4 `rentals` Collection
Stores peer-to-peer campus rental agreements, booking dates, separated rental fees and refundable deposits, bilateral handover states, and return condition inspection records.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Auto | | Primary key |
| `renter` | ObjectId | Yes | | Foreign reference to borrowing student (`users._id`) |
| `owner` | ObjectId | Yes | | Foreign reference to item owner (`users._id`) |
| `listing` | ObjectId | Yes | | Foreign reference to rented item (`listings._id`) |
| `startDate` | Date | Yes | | Start date of the rental period |
| `endDate` | Date | Yes | | End date of the rental period |
| `rentalPeriod` | String | Yes | `'per semester'` | Enum: `['per day', 'per week', 'per month', 'per semester']` |
| `durationUnits` | Number | Yes | `1` | Number of duration periods calculated from date range |
| `rentalFee` | Number | Yes | | Total calculated rental fee in USD (tracked separately from deposit) |
| `depositAmount` | Number | Yes | `0` | Refundable security deposit in USD |
| `status` | String | Yes | `'REQUESTED'` | Enum: `['REQUESTED', 'APPROVED', 'ACTIVE', 'RETURN_PENDING', 'COMPLETED', 'CANCELLED', 'OVERDUE', 'DISPUTED', 'REJECTED']` |
| `depositStatus` | String | Yes | `'HELD'` | Enum: `['HELD', 'REFUNDED', 'FORFEITED_PARTIAL', 'FORFEITED_FULL']` |
| `depositRefundAmount` | Number | No | `null` | Actual amount refunded upon return settlement |
| `depositDeductionAmount` | Number | No | `0` | Amount retained by owner for damages |
| `handover` | Object | Yes | | Handover verification flags & timestamps (pickup and return) |
| `handover.pickupConfirmedByRenter` | Boolean | No | `false` | True when renter verifies physical pickup |
| `handover.pickupConfirmedByOwner` | Boolean | No | `false` | True when owner verifies handover to renter |
| `handover.pickupConfirmedAt` | Date | No | `null` | Timestamp when bilateral pickup was achieved |
| `handover.returnConfirmedByRenter` | Boolean | No | `false` | True when renter confirms return drop-off |
| `handover.returnConfirmedByOwner` | Boolean | No | `false` | True when owner confirms item received back |
| `handover.returnConfirmedAt` | Date | No | `null` | Timestamp when return was settled |
| `conditionAtPickup` | String | No | `'Good'` | Recorded condition during physical handover |
| `conditionAtReturn` | String | No | `null` | Recorded condition upon return inspection |
| `damageReport` | Object | No | | Detailed damage disclosure if deposit is deducted |
| `damageReport.hasDamage` | Boolean | No | `false` | Whether physical damage or wear was observed |
| `damageReport.description` | String | No | `''` | Explanation of damage or missing parts |
| `notes` | String | No | `''` | Optional booking notes or special instructions |
| `cancellationReason` | String | No | `null` | Recorded reason if rental was cancelled before pickup |
| `timeline` | Array[Object] | No | `[]` | Embedded audit trail: `{ action, actor, note, timestamp }` |
| `createdAt` | Date | Auto | Current timestamp | Creation timestamp |
| `updatedAt` | Date | Auto | Current timestamp | Last update timestamp |

**Indexes:**
- `{ listing: 1, status: 1, startDate: 1, endDate: 1 }` (Overlap collision detection)
- `{ renter: 1, status: 1, createdAt: -1 }` (Renter dashboard / "Borrowed Items")
- `{ owner: 1, status: 1, createdAt: -1 }` (Owner dashboard / "Lent Items")

---

### 2.5 `orders` Collection
Stores peer-to-peer campus purchase contracts, price snapshot, campus pickup point, bilateral handover verification states, and payment statuses.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Auto | | Primary key |
| `buyer` | ObjectId | Yes | | Foreign reference to purchasing student (`users._id`) |
| `seller` | ObjectId | Yes | | Foreign reference to listing owner (`users._id`) |
| `listing` | ObjectId | Yes | | Foreign reference to purchased item (`listings._id`) |
| `itemPrice` | Number | Yes | | Outright purchase price in USD snapshot at order creation |
| `serviceFee` | Number | Yes | `0` | ThriftSync platform fee (0% for campus sustainability) |
| `totalAmount` | Number | Yes | | Total amount payable upon handover |
| `paymentMethod` | String | Yes | `'CAMPUS_HANDOVER'` | Enum: `['CAMPUS_HANDOVER', 'OFFLINE_ESCROW', 'STUDENT_PAY']` |
| `paymentStatus` | String | Yes | `'PENDING'` | Enum: `['PENDING', 'VERIFIED_UPON_HANDOVER', 'CANCELLED', 'REFUNDED']` |
| `pickupLocation` | String | Yes | `'Campus Student Center'` | Verified campus exchange location |
| `meetupNotes` | String | No | `''` | Pickup notes or preferred meeting times |
| `status` | String | Yes | `'PENDING'` | Enum: `['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED']` |
| `handover` | Object | Yes | | Bilateral delivery & payment verification flags |
| `handover.buyerConfirmed` | Boolean | No | `false` | True when buyer verifies receipt and payment handover |
| `handover.buyerConfirmedAt` | Date | No | `null` | Timestamp when buyer verified handover |
| `handover.sellerConfirmed` | Boolean | No | `false` | True when seller verifies delivery and payment received |
| `handover.sellerConfirmedAt` | Date | No | `null` | Timestamp when seller verified handover |
| `cancellationReason` | String | No | `null` | Reason if order is cancelled prior to completion |
| `timeline` | Array[Object] | No | `[]` | Embedded audit trail: `{ action, actor, note, timestamp }` |
| `createdAt` | Date | Auto | Current timestamp | Creation timestamp |
| `updatedAt` | Date | Auto | Current timestamp | Last update timestamp |

**Indexes:**
- `{ buyer: 1, status: 1, createdAt: -1 }` (Buyer dashboard / "Purchases")
- `{ seller: 1, status: 1, createdAt: -1 }` (Seller dashboard / "Sales")
- `{ listing: 1, status: 1 }` (Listing order lookup)

---

### 2.6 `reviews` Collection
Stores authentic peer ratings and feedback for verified completed campus transactions (purchases, rentals, or swaps).

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Auto | | Primary key |
| `author` | ObjectId | Yes | | Foreign reference to student author (`users._id`) |
| `targetUser` | ObjectId | Yes | | Foreign reference to peer being reviewed (`users._id`) |
| `listing` | ObjectId | Yes | | Foreign reference to transaction item (`listings._id`) |
| `transactionType` | String | Yes | | Enum: `['PURCHASE', 'RENTAL', 'SWAP']` |
| `transactionId` | ObjectId | Yes | | Foreign reference to completed transaction document |
| `rating` | Number | Yes | | Rating from 1 to 5 stars |
| `reviewText` | String | Yes | | Review feedback (5–1000 characters) |
| `criteria` | Object | Yes | | Detailed peer rating criteria |
| `criteria.itemConditionAsDescribed` | Boolean | No | `true` | Whether item condition matched listing disclosure |
| `criteria.punctualHandover` | Boolean | No | `true` | Whether peer was punctual at exchange spot |
| `criteria.communication` | Number | No | `5` | Communication score (1 to 5) |
| `isVerifiedTransaction` | Boolean | Yes | `true` | Verified transaction badge enforced on server |
| `createdAt` | Date | Auto | Current timestamp | Creation timestamp |
| `updatedAt` | Date | Auto | Current timestamp | Last update timestamp |

**Indexes:**
- `{ author: 1, transactionId: 1 }` (Unique: strictly prevents duplicate reviews per transaction)
- `{ targetUser: 1, createdAt: -1 }` (User trust score queries)
- `{ listing: 1, createdAt: -1 }` (Listing reviews)

---

### 2.7 `addresses` Collection (Money Path MVP)
Stores Indian delivery destination addresses with PIN code and mobile phone validation.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Auto | | Primary key |
| `user` | ObjectId | Yes | | Foreign reference to owner (`users._id`) |
| `fullName` | String | Yes | | Recipient full name (2–100 chars) |
| `phone` | String | Yes | | 10-digit Indian mobile number (`^[6-9]\d{9}$`) |
| `street` | String | Yes | | Campus hostel, room, or street address |
| `city` | String | Yes | | City |
| `state` | String | Yes | `'Delhi'` | Indian State |
| `postalCode` | String | Yes | | 6-digit Indian PIN code (`^\d{6}$`) |
| `isDefault` | Boolean | No | `false` | Whether address is user's primary delivery address |
| `createdAt` | Date | Auto | Current timestamp | Timestamp of creation |
| `updatedAt` | Date | Auto | Current timestamp | Timestamp of last update |

**Indexes:**
- `{ user: 1, isDefault: -1 }`

---

### 2.8 `carts` Collection (Money Path MVP)
Stores active cart items for authenticated users or guest browsing sessions.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Auto | | Primary key |
| `user` | ObjectId | Conditional | `null` | Foreign reference to user (`users._id`) |
| `guestId` | String | Conditional | `null` | Guest session identifier |
| `items` | Array[Object] | No | `[]` | Array of `{ listing, quantity, pricePaise, addedAt }` |
| `lastActiveAt` | Date | No | Current timestamp | Cart activity timestamp |
| `createdAt` | Date | Auto | Current timestamp | Creation timestamp |
| `updatedAt` | Date | Auto | Current timestamp | Last update timestamp |

**Indexes:**
- `{ user: 1 }` (Unique, sparse)
- `{ guestId: 1 }` (Unique, sparse)

---

### 2.9 `reservations` Collection (Money Path MVP)
Tracks race-safe two-phase 15-minute stock holds during active checkout sessions.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Auto | | Primary key |
| `orderId` | ObjectId | Yes | | Foreign reference to pending order (`orders._id`) |
| `listingId` | ObjectId | Yes | | Foreign reference to reserved item (`listings._id`) |
| `quantity` | Number | Yes | `1` | Quantity reserved |
| `status` | String | Yes | `'PENDING'` | Enum: `['PENDING', 'COMMITTED', 'RELEASED']` |
| `expiresAt` | Date | Yes | | Reservation expiration timestamp (15 minutes from creation) |
| `createdAt` | Date | Auto | Current timestamp | Creation timestamp |
| `updatedAt` | Date | Auto | Current timestamp | Last update timestamp |

**Indexes:**
- `{ orderId: 1 }`
- `{ listingId: 1, status: 1 }`
- `{ status: 1, expiresAt: 1 }`

---

### 2.10 `idempotency_records` Collection (Money Path MVP)
Prevents double-charging, duplicate orders, and replay attacks across payment and checkout requests.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Auto | | Primary key |
| `key` | String | Yes | | Idempotency key from client header |
| `actor` | String | Yes | | User ID or guest session identifier |
| `operation` | String | Yes | | Operation tag (e.g., `checkout_initiate`) |
| `response` | Object | Yes | | Cached response payload to replay on duplicate requests |
| `statusCode` | Number | Yes | `200` | HTTP response status code |
| `createdAt` | Date | Auto | Current timestamp | Creation timestamp (24h TTL) |

**Indexes:**
- `{ actor: 1, key: 1, operation: 1 }` (Unique)
- `{ createdAt: 1 }` (TTL: 86400 seconds)

---

### 2.11 `payments` & `payment_webhooks` Collections (Money Path MVP)
Tracks payment attempt records and guarantees webhook idempotency.

- `payments`: `{ order, user, provider, providerOrderId, providerPaymentId, amountPaise, currency, status, signature, rawPayload }`
  - Indexes: `{ order: 1 }`, `{ providerOrderId: 1 }`, `{ providerPaymentId: 1 }`
- `payment_webhooks`: `{ eventId, provider, eventType, status, processedAt }`
  - Indexes: `{ eventId: 1, provider: 1 }` (Unique)

---

### 2.12 `status_histories` Collection (Money Path MVP)
Provides an immutable audit trail for all order state transitions.

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary key |
| `orderId` | ObjectId | Yes | Reference to `orders._id` |
| `field` | String | Yes | Enum: `['orderStatus', 'paymentStatus', 'fulfillmentStatus']` |
| `from` | String | Yes | Previous state value |
| `to` | String | Yes | New state value |
| `changedBy` | ObjectId | No | User ID or system actor |
| `reason` | String | No | Reason or trigger for transition |
| `createdAt` | Date | Auto | Timestamp of transition |

**Indexes:**
- `{ orderId: 1, createdAt: -1 }`

---

## 3. Relationships & Data Integrity Constraints

1. **User to Listings (1 : N):**
   - Each listing contains a mandatory foreign reference `seller` pointing to `users._id`.
   - On deletion/archive, listings retain the historical seller reference.
2. **Deposit & Rental Separation:**
   - As mandated by `AGENTS.md`, rental fees and security deposits are stored as separate numeric attributes (`rentalRate` vs `deposit` on listing; `rentalFee` vs `depositAmount` on rental record).
3. **Inventory State Protection & Concurrency Safeguards:**
   - `status` field guards against duplicate checkouts: items in `'reserved'`, `'rented'`, `'sold'`, or `'archived'` states are excluded from active public catalog queries.
   - On order creation, the listing undergoes atomic conditional reservation (`status: 'active' -> 'reserved'`), locking it from competing buyers or renters.
   - On order completion, the listing permanently updates to `'sold'`.
   - On order cancellation, the listing atomically reverts to `'active'`.
4. **Bilateral Handover Completion:**
   - Circular swaps reach `COMPLETED` state only when both `proposerConfirmed` and `recipientConfirmed` flags are verified.
   - Rentals reach `ACTIVE` state only when both `pickupConfirmedByRenter` and `pickupConfirmedByOwner` flags are verified.
   - Orders reach `COMPLETED` state only when both `buyerConfirmed` and `sellerConfirmed` flags are verified.
5. **Authentic Peer Trust & Zero Fabrication:**
   - In accordance with `AGENTS.md`, reviews can only be submitted for completed transactions where the author was a verified participant. Duplicate reviews on the same transaction are rejected with a unique index constraint.

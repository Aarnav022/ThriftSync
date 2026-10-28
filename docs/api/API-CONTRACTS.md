# ThriftSync — API Contracts

This document specifies the authoritative contracts, security constraints, and response envelopes for the ThriftSync REST API.

---

## Base URL
- Development: `http://localhost:5000/api`
- Reverse Proxy: `/api` (configured via Vite in local development)

## Standard Response Envelope
All API responses return a structured JSON envelope:
- **Success (`2xx`):**
  ```json
  {
    "status": "success",
    "message": "Optional descriptive message",
    "data": { ... }
  }
  ```
- **Client Error (`4xx`):**
  ```json
  {
    "status": "fail",
    "message": "Human-readable error description",
    "errors": [
      { "field": "email", "message": "Please provide a valid email address" }
    ]
  }
  ```
- **Server Error (`5xx`):**
  ```json
  {
    "status": "error",
    "message": "Internal Server Error"
  }
  ```

---

## 1. System Endpoints

### `GET /api/health`
Checks API process status and database readiness.
- **Auth Required:** No
- **Rate Limited:** No
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "ok",
    "service": "ThriftSync API",
    "timestamp": "2026-10-28T13:17:38.162Z",
    "uptime": 45.2,
    "database": {
      "status": "connected",
      "ready": true
    }
  }
  ```

---

## 2. Authentication Module (`/api/auth`)

### `POST /api/auth/register`
Registers a new campus user. Server strictly enforces `role: "student"` on registration, ignoring client-supplied roles.
- **Auth Required:** No
- **Rate Limited:** Yes (`authLimiter`: 20 requests / 15 min)
- **Request Body (application/json):**
  ```json
  {
    "name": "Alex Rivera",
    "email": "alex.rivera@campus.edu",
    "password": "Password123!",
    "campus": "North Quad"
  }
  ```
- **Validation Rules (Zod):**
  - `name`: String, required, 2–100 characters.
  - `email`: String, required, valid email, trimmed & lowercased.
  - `password`: String, required, min 8 characters, must contain at least 1 letter and 1 number.
  - `campus`: String, optional, max 100 characters.
- **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "message": "Account successfully registered",
    "data": {
      "user": {
        "_id": "671fb2...",
        "name": "Alex Rivera",
        "email": "alex.rivera@campus.edu",
        "role": "student",
        "campus": "North Quad",
        "avatar": null,
        "isActive": true
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Input validation failed (`errors` array provided).
  - `409 Conflict`: `"An account with this email already exists"`.
  - `429 Too Many Requests`: Rate limit exceeded.

---

### `POST /api/auth/login`
Authenticates a registered student or administrator.
- **Auth Required:** No
- **Rate Limited:** Yes (`authLimiter`: 20 requests / 15 min)
- **Request Body (application/json):**
  ```json
  {
    "email": "alex.rivera@campus.edu",
    "password": "Password123!"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Successfully authenticated",
    "data": {
      "user": {
        "_id": "671fb2...",
        "name": "Alex Rivera",
        "email": "alex.rivera@campus.edu",
        "role": "student",
        "campus": "North Quad"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid or missing email/password.
  - `401 Unauthorized`: `"Invalid email or password"`.
  - `429 Too Many Requests`: Rate limit exceeded.

---

### `GET /api/auth/me`
Retrieves the profile of the currently authenticated user.
- **Auth Required:** Yes (`Authorization: Bearer <token>`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "_id": "671fb2...",
        "name": "Alex Rivera",
        "email": "alex.rivera@campus.edu",
        "role": "student",
        "campus": "North Quad",
        "isActive": true
      }
    }
  }
  ```

---

### `GET /api/auth/admin-check`
Demonstrates server-side role authorization. Accessible only by verified administrators.
- **Auth Required:** Yes (`Authorization: Bearer <token>`), user `role` must be `'admin'`.
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Access granted: Verified administrator role.",
    "data": {
      "userId": "671fb2...",
      "role": "admin"
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid token.
  - `403 Forbidden`: `"Access denied: Administrator privileges required."`

---

## 3. Listings & Catalog Module (`/api/listings`)

### `GET /api/listings`
Retrieves public catalog listings with rich faceted filtering, search, and pagination.
- **Auth Required:** No
- **Query Parameters:**
  - `category`: Filter by category (`Textbooks`, `Fashion`, `Electronics`, `Dorm & Living`, `Other`).
  - `condition`: Filter by condition (`Like New`, `Excellent`, `Good`, `Fair`).
  - `listingType`: Filter availability model (`buy`, `rent`, `swap`, `buy_and_rent`).
  - `campus`: Filter by campus location / dorm quad.
  - `search`: Keyword search matching against `title` and `description` (sanitized with ReDoS escaping).
  - `minPrice` / `maxPrice`: Numerical price range bounds for purchases.
  - `minRentalRate` / `maxRentalRate`: Numerical rental rate range bounds.
  - `sort`: Ordering criterion (`newest` [default], `price_asc`, `price_desc`, `rental_asc`, `rental_desc`, `oldest`).
  - `page`: Page number (integer, minimum 1, default 1).
  - `limit`: Number of results per page (integer, 1–50, default 20).
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "listings": [ ... ],
      "total": 1,
      "page": 1,
      "totalPages": 1
    }
  }
  ```

---

### `POST /api/listings`
Creates a new listing under the authenticated student's profile.
- **Auth Required:** Yes (`Authorization: Bearer <token>`)
- **Rate Limited:** Yes (`creationLimiter`: 60 requests / hour)
- **Request Body (application/json):**
  ```json
  {
    "title": "Principles of Economics (10th Ed)",
    "description": "Hardcover copy for ECON 101, zero missing pages",
    "category": "Textbooks",
    "condition": "Like New",
    "listingType": "buy_and_rent",
    "price": 35.0,
    "rentalRate": 10.0,
    "rentalPeriod": "per semester",
    "deposit": 20.0,
    "campus": "North Quad",
    "pickupLocation": "Main Library Lobby"
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "message": "Listing created successfully",
    "data": { "listing": { ... } }
  }
  ```

---

### `GET /api/listings/mine`
Retrieves all listings posted by the authenticated user.
- **Auth Required:** Yes (`Authorization: Bearer <token>`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": { "listings": [ ... ] }
  }
  ```

---

### `GET /api/listings/:id`
Retrieves detailed information for a single listing.
- **Auth Required:** No
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": { "listing": { ... } }
  }
  ```

---

### `PUT /api/listings/:id`
Updates an existing listing. Enforces seller ownership or admin privileges.
- **Auth Required:** Yes (`Authorization: Bearer <token>`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Listing updated successfully",
    "data": { "listing": { ... } }
  }
  ```
- **Error Responses:**
  - `403 Forbidden`: User is neither listing owner nor admin.
  - `404 Not Found`: Listing not found.

---

### `DELETE /api/listings/:id`
Archives a listing. Enforces seller ownership or admin privileges.
- **Auth Required:** Yes (`Authorization: Bearer <token>`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Listing successfully archived",
    "data": { "listing": { ... } }
  }
  ```

---

## 4. Circular Student Swaps Module (`/api/swaps`)

All swap endpoints require user authentication (`Authorization: Bearer <token>`).

### `POST /api/swaps`
Proposes a circular swap between an offered item belonging to the authenticated student and a requested item belonging to another student.
- **Auth Required:** Yes
- **Rate Limited:** Yes (`creationLimiter`: 60 requests / hour)
- **Request Body (application/json):**
  ```json
  {
    "offeredListingId": "607f1f77bcf86cd799439101",
    "requestedListingId": "607f1f77bcf86cd799439102",
    "message": "Hi! Would love to trade my Calculus book for your Chemistry kit."
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "message": "Swap proposal created successfully",
    "data": { "swap": { ... } }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Input validation failed, self-swap attempt, or listing not active.
  - `403 Forbidden`: Offered listing does not belong to authenticated user.
  - `404 Not Found`: Offered or requested listing not found.
  - `409 Conflict`: An active swap proposal already exists between these items.

---

### `GET /api/swaps`
Retrieves swap proposals involving the authenticated student.
- **Auth Required:** Yes
- **Query Parameters:** `type` (`incoming` | `outgoing`), `status`.
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": { "swaps": [ ... ], "total": 1 }
  }
  ```

---

### `GET /api/swaps/:id`
Retrieves detailed proposal information, counter-offer history, and audit timeline for an individual swap.
- **Auth Required:** Yes (must be proposer, recipient, or admin)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": { "swap": { ... } }
  }
  ```
- **Error Responses:**
  - `403 Forbidden`: User is not a participant in this exchange.

---

### `POST /api/swaps/:id/counter-offers`
Submits a counter-offer altering the terms or offered item.
- **Auth Required:** Yes (must be user's turn)
- **Request Body (application/json):**
  ```json
  {
    "offeredListingId": "607f1f77bcf86cd799439103",
    "message": "Could you also include the study guide with this exchange?"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Counter-offer submitted successfully",
    "data": { "swap": { ... } }
  }
  ```

---

### `POST /api/swaps/:id/accept`
Accepts a proposal or counter-offer, atomically reserving both listings.
- **Auth Required:** Yes (must be active receiving party)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Swap proposal accepted. Items reserved for exchange.",
    "data": { "swap": { ... } }
  }
  ```
- **Error Responses:**
  - `403 Forbidden`: Not active receiving party.
  - `409 Conflict`: One or both listings are no longer active/available (competing acceptance protection).

---

### `POST /api/swaps/:id/reject`
Rejects an incoming proposal or counter-offer.
- **Auth Required:** Yes (must be active receiving party)
- **Request Body (application/json):**
  ```json
  { "reason": "Looking for different course materials" }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Swap proposal rejected",
    "data": { "swap": { ... } }
  }
  ```

---

### `POST /api/swaps/:id/withdraw`
Withdraws an active proposal prior to acceptance by the offering party.
- **Auth Required:** Yes (must be offering party)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Swap proposal withdrawn",
    "data": { "swap": { ... } }
  }
  ```

---

### `POST /api/swaps/:id/cancel`
Cancels an accepted exchange prior to completion, releasing item reservations back to active status.
- **Auth Required:** Yes (must be participant)
- **Request Body (application/json):**
  ```json
  { "reason": "Unable to coordinate campus meeting this semester" }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Swap exchange cancelled. Item reservations released.",
    "data": { "swap": { ... } }
  }
  ```

---

### `POST /api/swaps/:id/confirm-handover`
Confirms physical handover of items. Transitions to `COMPLETED` when both participants independently confirm.
- **Auth Required:** Yes (must be participant)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Physical handover confirmed by both participants! Exchange completed.",
    "data": { "swap": { ... } }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Swap not in ACCEPTED state, or user already confirmed.
  - `403 Forbidden`: User is not a participant in this exchange.

---

## 5. Users & Profile Module (`/api/users`)

### `GET /api/users/profile`
Retrieves the authenticated user's private profile.
- **Auth Required:** Yes (`Authorization: Bearer <token>`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": { "user": { ... } }
  }
  ```

---

### `PUT /api/users/profile`
Updates the authenticated user's profile with strict User Data Isolation.
- **Auth Required:** Yes (`Authorization: Bearer <token>`)
- **Request Body (application/json):**
  ```json
  {
    "name": "Alex Rivera",
    "campus": "South Village",
    "avatar": "https://example.com/avatar.jpg"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Profile updated successfully",
    "data": { "user": { ... } }
  }
  ```

---

### `GET /api/users/:id/public`
Retrieves sanitized public peer information (strips email, role, password, and account status).
- **Auth Required:** No
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "_id": "671fb2...",
        "name": "Alex Rivera",
        "campus": "North Quad",
        "avatar": null,
        "createdAt": "2026-10-28T14:00:00.000Z"
      }
    }
  }
  ```

---

## 6. Administration Module (`/api/admin`)

All administrative routes enforce strict Role-Based Access Control (`requireAuthentication` + `requireAdmin`). Standard users and students receive `403 Forbidden`.

### `GET /api/admin/metrics`
Returns system-wide metrics across platform entities.
- **Auth Required:** Yes (`role: "admin"`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "metrics": {
        "totalUsers": 150,
        "totalListings": 320,
        "activeListings": 280,
        "totalSwaps": 45,
        "completedSwaps": 18
      }
    }
  }
  ```

---

### `GET /api/admin/users`
Lists user accounts with moderation filters and pagination.
- **Auth Required:** Yes (`role: "admin"`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "users": [ ... ],
      "total": 150,
      "page": 1,
      "totalPages": 8
    }
  }
  ```

---

### `PATCH /api/admin/users/:id/status`
Suspends or reactivates a user account.
- **Auth Required:** Yes (`role: "admin"`)
- **Request Body (application/json):**
  ```json
  { "isActive": false }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "User account has been suspended",
    "data": { "user": { ... } }
  }
  ```

---

### `GET /api/admin/listings`
Lists all listings across all states (`active`, `reserved`, `sold`, `archived`) for moderation review.
- **Auth Required:** Yes (`role: "admin"`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": { "listings": [ ... ], "total": 320 }
  }
  ```

---

### `PATCH /api/admin/listings/:id/status`
Updates listing status for moderation (e.g. archiving inappropriate items).
- **Auth Required:** Yes (`role: "admin"`)
- **Request Body (application/json):**
  ```json
  { "status": "archived" }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Listing status updated to archived",
    "data": { "listing": { ... } }
  }
  ```

---

## 7. Rentals Module (`/api/rentals`)

### `POST /api/rentals`
Initiates a new rental request for an eligible listing. Enforces date validation, overlap collision checks, and separate fee and deposit calculations.
- **Auth Required:** Yes (`requireAuthentication`)
- **Rate Limited:** Yes (`creationLimiter`)
- **Request Body (application/json):**
  ```json
  {
    "listingId": "671fb4...",
    "startDate": "2026-11-01T00:00:00.000Z",
    "endDate": "2026-12-01T00:00:00.000Z",
    "notes": "Need for Economics class midterm project"
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "message": "Rental request submitted successfully",
    "data": {
      "rental": {
        "_id": "6720c1...",
        "renter": { "_id": "671fb2...", "name": "Alex Rivera", "campus": "North Quad" },
        "owner": { "_id": "671fb3...", "name": "Maya Lin", "campus": "East Quad" },
        "listing": { "_id": "671fb4...", "title": "Economics Textbook", "rentalRate": 8 },
        "startDate": "2026-11-01T00:00:00.000Z",
        "endDate": "2026-12-01T00:00:00.000Z",
        "rentalPeriod": "per month",
        "durationUnits": 1,
        "rentalFee": 8,
        "depositAmount": 15,
        "status": "REQUESTED",
        "depositStatus": "HELD"
      }
    }
  }
  ```

---

### `GET /api/rentals`
Retrieves rental requests associated with the authenticated user.
- **Auth Required:** Yes (`requireAuthentication`)
- **Query Parameters:**
  - `role`: Filter by role (`renter` for "Borrowed Items", `owner` for "Lent Items", or omitted for both)
  - `status`: Optional lifecycle filter (`REQUESTED`, `APPROVED`, `ACTIVE`, `RETURN_PENDING`, `COMPLETED`, `CANCELLED`, `DISPUTED`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "rentals": [ ... ],
      "count": 3
    }
  }
  ```

---

### `GET /api/rentals/:id`
Retrieves full details of a specific rental contract.
- **Auth Required:** Yes (must be participant or admin)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "rental": { ... }
    }
  }
  ```

---

### `PATCH /api/rentals/:id/decision`
Allows the listing owner to approve or reject a rental request.
- **Auth Required:** Yes (owner only)
- **Request Body (application/json):**
  ```json
  {
    "decision": "APPROVE"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Rental request approved",
    "data": { "rental": { ... } }
  }
  ```

---

### `PATCH /api/rentals/:id/handover`
Confirms physical handover at designated safe exchange spot. When both renter and owner have confirmed, status advances to `ACTIVE` and the listing status updates to `'rented'`.
- **Auth Required:** Yes (participant only)
- **Request Body (application/json):**
  ```json
  {
    "condition": "Excellent",
    "note": "Item received in great shape at Student Center Desk"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Handover pickup confirmed",
    "data": { "rental": { ... } }
  }
  ```

---

### `PATCH /api/rentals/:id/return`
Handles return handover and condition inspection. Renter marks return pending, or owner inspects condition and authorizes deposit refund / damage deduction. When return is confirmed by owner, status becomes `COMPLETED` and listing status reverts to `'active'`.
- **Auth Required:** Yes (participant only)
- **Request Body (application/json):**
  ```json
  {
    "action": "CONFIRM_RETURN",
    "conditionAtReturn": "Good",
    "depositAction": "FULL_REFUND",
    "damageDescription": "",
    "deductionAmount": 0
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Return confirmed and security deposit settled",
    "data": { "rental": { ... } }
  }
  ```

---

### `PATCH /api/rentals/:id/cancel`
Cancels a rental prior to bilateral pickup handover.
- **Auth Required:** Yes (participant only)
- **Request Body (application/json):**
  ```json
  {
    "reason": "Change of course schedule"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Rental request cancelled",
    "data": { "rental": { ... } }
  }
  ```

---

## 8. Orders & Campus Purchase Module (`/api/orders`)

### `POST /api/orders`
Places an outright purchase order on an active purchasable item (`listingType: 'buy'` or `'buy_and_rent'`). Atomically locks the item (`status: 'reserved'`) to prevent competing buyers or renters from double-booking.
- **Auth Required:** Yes (`requireAuthentication`)
- **Rate Limited:** Yes (`creationLimiter`)
- **Request Body (application/json):**
  ```json
  {
    "listingId": "671fb4...",
    "pickupLocation": "Campus Student Center",
    "meetupNotes": "Can meet Tuesday after 2pm lecture",
    "paymentMethod": "CAMPUS_HANDOVER"
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "message": "Purchase order created successfully",
    "data": {
      "order": {
        "_id": "6720e5...",
        "buyer": { "_id": "671fb2...", "name": "Alex Rivera", "campus": "North Quad" },
        "seller": { "_id": "671fb3...", "name": "Maya Lin", "campus": "East Quad" },
        "listing": { "_id": "671fb4...", "title": "Economics Textbook", "price": 28 },
        "itemPrice": 28,
        "serviceFee": 0,
        "totalAmount": 28,
        "paymentMethod": "CAMPUS_HANDOVER",
        "paymentStatus": "PENDING",
        "pickupLocation": "Campus Student Center",
        "status": "PENDING"
      }
    }
  }
  ```

---

### `GET /api/orders`
Retrieves orders for the authenticated student.
- **Auth Required:** Yes (`requireAuthentication`)
- **Query Parameters:**
  - `role`: Filter by role (`buyer` for Purchases, `seller` for Sales, or omitted for all)
  - `status`: Optional filter (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `DISPUTED`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "orders": [ ... ],
      "count": 2
    }
  }
  ```

---

### `GET /api/orders/:id`
Retrieves detailed information and timeline for a specific purchase order.
- **Auth Required:** Yes (buyer, seller, or admin)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": { "order": { ... } }
  }
  ```

---

### `PATCH /api/orders/:id/confirm`
Allows seller to accept the purchase order and confirm pickup location and schedule.
- **Auth Required:** Yes (seller only)
- **Request Body (application/json):**
  ```json
  {
    "pickupLocation": "Student Center Information Desk",
    "meetupNotes": "Confirmed, see you Tuesday at 2:15pm"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Purchase order confirmed by seller",
    "data": { "order": { ... } }
  }
  ```

---

### `PATCH /api/orders/:id/handover`
Records physical handover and payment verification at campus safe exchange zone. When both buyer and seller confirm, order status transitions to `COMPLETED`, payment status transitions to `VERIFIED_UPON_HANDOVER`, and the listing permanently transitions to `'sold'`.
- **Auth Required:** Yes (participant only)
- **Request Body (application/json):**
  ```json
  {
    "note": "Item received in excellent condition and cash paid"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Handover confirmed",
    "data": { "order": { ... } }
  }
  ```

---

### `PATCH /api/orders/:id/cancel`
Cancels an uncompleted purchase order and atomically unlocks the listing back to `status: 'active'`.
- **Auth Required:** Yes (buyer or seller)
- **Request Body (application/json):**
  ```json
  {
    "reason": "Schedule mismatch for campus meetup"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Purchase order cancelled",
    "data": { "order": { ... } }
  }
  ```

---

### `PATCH /api/orders/:id/dispute`
Flags a purchase transaction for campus mediator or administrative review.
- **Auth Required:** Yes (participant only)
- **Request Body (application/json):**
  ```json
  {
    "reason": "Seller did not show up at designated campus exchange desk"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Dispute submitted for review",
    "data": { "order": { ... } }
  }
  ```

---

## 9. Reviews & Trust Verification Module (`/api/reviews`)

### `POST /api/reviews`
Submits an authentic peer review for a completed transaction (`PURCHASE`, `RENTAL`, or `SWAP`). Enforces verification check (transaction must be `COMPLETED` and author must be a participant) and prevents duplicate reviews.
- **Auth Required:** Yes (`requireAuthentication`)
- **Rate Limited:** Yes (`creationLimiter`)
- **Request Body (application/json):**
  ```json
  {
    "targetUserId": "671fb3...",
    "listingId": "671fb4...",
    "transactionType": "PURCHASE",
    "transactionId": "6720e5...",
    "rating": 5,
    "reviewText": "Textbook was in pristine condition, met right on time at the Student Center desk!",
    "itemConditionAsDescribed": true,
    "punctualHandover": true,
    "communication": 5
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "message": "Peer review submitted successfully",
    "data": {
      "review": {
        "_id": "6720f1...",
        "author": { "_id": "671fb2...", "name": "Alex Rivera", "campus": "North Quad" },
        "targetUser": { "_id": "671fb3...", "name": "Maya Lin", "campus": "East Quad" },
        "listing": { "_id": "671fb4...", "title": "Economics Textbook" },
        "transactionType": "PURCHASE",
        "rating": 5,
        "reviewText": "Textbook was in pristine condition, met right on time at the Student Center desk!",
        "criteria": {
          "itemConditionAsDescribed": true,
          "punctualHandover": true,
          "communication": 5
        },
        "isVerifiedTransaction": true,
        "createdAt": "2026-10-28T18:00:00.000Z"
      }
    }
  }
  ```

---

### `GET /api/reviews/user/:userId`
Retrieves peer reviews and aggregated trust metrics for a specific campus community member.
- **Auth Required:** No
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "reviews": [ ... ],
      "trustMetrics": {
        "averageRating": 4.9,
        "totalReviews": 12,
        "verifiedCount": 12,
        "conditionAccuracyRate": 100,
        "punctualityRate": 92
      }
    }
  }
  ```

---

### `GET /api/reviews/listing/:listingId`
Retrieves reviews associated with a specific listing.
- **Auth Required:** No
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "reviews": [ ... ],
      "count": 3
    }
  }
  ```

---

### `GET /api/reviews/mine`
Retrieves all verified reviews submitted by the authenticated student.
- **Auth Required:** Yes (`requireAuthentication`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "reviews": [ ... ],
      "count": 4
    }
  }
  ```

---

## 8. Multipart Image Uploads Module (`/api/uploads`)

Handles campus listing photo uploads to Cloudinary with automatic optimization (`quality: 'auto'`, `fetch_format: 'auto'`), 5MB file size limit, and strict MIME type enforcement (`image/jpeg`, `image/png`, `image/webp`, `image/gif`). Rate limited via `creationLimiter`.

### `POST /api/uploads/image`
Uploads a single image for campus listings or user avatars.
- **Auth Required:** Yes (`requireAuthentication`)
- **Content-Type:** `multipart/form-data`
- **Body Fields:**
  - `image`: File (Binary, max 5MB, format: JPG, PNG, WebP, GIF)
- **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "message": "Image uploaded successfully",
    "data": {
      "url": "https://res.cloudinary.com/thriftsync/image/upload/v1729000000/thriftsync/listings/abc123.webp",
      "publicId": "thriftsync/listings/abc123"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: "No image file provided." or "File rejected: Only image files (JPEG, PNG, WebP, GIF) are permitted."
  - `401 Unauthorized`: "Authentication token is missing or invalid."
  - `429 Too Many Requests`: Rate limit exceeded (more than 50 uploads per 15 minutes).

---

### `POST /api/uploads/images`
Uploads multiple images (up to 5) in a single request for campus listings.
- **Auth Required:** Yes (`requireAuthentication`)
- **Content-Type:** `multipart/form-data`
- **Body Fields:**
  - `images`: File[] (Binary, max 5 files, max 5MB per file)
- **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "message": "Successfully uploaded 3 images",
    "data": {
      "images": [
        {
          "url": "https://res.cloudinary.com/thriftsync/image/upload/v1729000000/thriftsync/listings/img1.webp",
          "publicId": "thriftsync/listings/img1"
        },
        {
          "url": "https://res.cloudinary.com/thriftsync/image/upload/v1729000000/thriftsync/listings/img2.webp",
          "publicId": "thriftsync/listings/img2"
        }
      ]
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: "No image files provided." or "File upload limit exceeded: Maximum 5 images allowed per upload."
  - `401 Unauthorized`: "Authentication token is missing or invalid."

---

## 9. Campus Notifications & Handover Safety Module (`/api/notifications`)

Manages real-time campus trade notices, safe handover alerts, order confirmations, rental milestone updates, and circular swap proposals. All endpoints require user authentication (`requireAuthentication`).

### `GET /api/notifications`
Retrieves notifications for the authenticated student, sorted newest first, with unread count.
- **Auth Required:** Yes (`requireAuthentication`)
- **Query Parameters:**
  - `unreadOnly`: Boolean (`true` to filter only unread notices).
  - `page`: Page number (integer, default 1).
  - `limit`: Results per page (1–50, default 20).
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "notifications": [
        {
          "_id": "6720f8...",
          "recipient": "671fb2...",
          "type": "ORDER_PLACED",
          "title": "New Order Received",
          "message": "Maya ordered your Economics textbook. Safe handover location: Campus Student Center.",
          "link": "/orders",
          "isRead": false,
          "createdAt": "2026-10-28T21:40:00.000Z"
        }
      ],
      "total": 1,
      "unreadCount": 1,
      "page": 1,
      "totalPages": 1
    }
  }
  ```

---

### `PATCH /api/notifications/:id/read`
Marks an individual notification as read. Enforces user ownership (`recipient === req.user._id`).
- **Auth Required:** Yes (`requireAuthentication`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Notification marked as read.",
    "data": {
      "notification": {
        "_id": "6720f8...",
        "isRead": true
      }
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid token.
  - `404 Not Found`: "Notification not found or access denied."

---

### `PATCH /api/notifications/mark-all-read`
Marks all unread notifications for the authenticated student as read.
- **Auth Required:** Yes (`requireAuthentication`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "All notifications marked as read.",
    "data": {
      "modifiedCount": 4
    }
  }
  ```

---

## 9. Campus Administration & Moderation Module (`/api/admin`)

### `POST /api/admin/reports`
Submits a student report or safety flag for an item or user. Protected by anti-spam rate limiting and a unique compound index `{ reporter: 1, targetType: 1, targetId: 1 }` preventing duplicate abuse.
- **Auth Required:** Yes (`requireAuthentication`)
- **Rate Limited:** Yes (`creationLimiter`: 30 requests / 15 min)
- **Request Body (application/json):**
  ```json
  {
    "targetType": "listing",
    "targetId": "671fb2...",
    "reason": "prohibited_item",
    "description": "Item violates campus electronic regulations."
  }
  ```
- **Validation Rules (Zod):**
  - `targetType`: Enum (`listing`, `user`).
  - `targetId`: Valid MongoDB ObjectId string.
  - `reason`: Enum (`prohibited_item`, `counterfeit`, `inappropriate_content`, `misleading_description`, `harassment_or_safety`, `other`).
  - `description`: String, required, 5–1000 characters.
- **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "message": "Report submitted successfully to campus moderation.",
    "data": {
      "report": {
        "_id": "67210a...",
        "reporter": "671fb2...",
        "targetType": "listing",
        "targetId": "671fb2...",
        "reason": "prohibited_item",
        "description": "Item violates campus electronic regulations.",
        "status": "pending",
        "createdAt": "2026-10-28T22:00:00.000Z"
      }
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: "You have already submitted a report for this listing."

---

### `GET /api/admin/metrics`
Retrieves consolidated campus marketplace analytics across users, listings, swaps, rentals, orders, and moderation queues.
- **Auth Required:** Yes (`requireAuthentication` + `requireAdmin`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "metrics": {
        "totalUsers": 150,
        "totalListings": 320,
        "activeListings": 280,
        "totalSwaps": 45,
        "completedSwaps": 28,
        "totalOrders": 110,
        "pendingReports": 2
      }
    }
  }
  ```
- **Error Responses:**
  - `403 Forbidden`: "Access denied. Platform administrator privileges required."

---

### `GET /api/admin/reports`
Lists reported listings and users with moderation status and pagination.
- **Auth Required:** Yes (`requireAuthentication` + `requireAdmin`)
- **Query Parameters:**
  - `status`: String (`pending`, `reviewed`, `resolved`, `dismissed`).
  - `targetType`: String (`listing`, `user`).
  - `page`: Page number (integer, default 1).
  - `limit`: Results per page (1–50, default 20).
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "reports": [
        {
          "_id": "67210a...",
          "reporter": {
            "_id": "671fb2...",
            "name": "Student Reporter",
            "email": "reporter@campus.edu"
          },
          "targetType": "listing",
          "targetId": {
            "_id": "671fb9...",
            "title": "Textbook",
            "status": "active"
          },
          "reason": "prohibited_item",
          "description": "Item violates regulations.",
          "status": "pending",
          "createdAt": "2026-10-28T22:00:00.000Z"
        }
      ],
      "total": 1,
      "page": 1,
      "totalPages": 1
    }
  }
  ```

---

### `PATCH /api/admin/reports/:id`
Resolves or dismisses a moderation report, optionally executing disciplinary actions (e.g. `SUSPEND_LISTING`, `SUSPEND_USER`).
- **Auth Required:** Yes (`requireAuthentication` + `requireAdmin`)
- **Request Body (application/json):**
  ```json
  {
    "status": "resolved",
    "action": "SUSPEND_LISTING",
    "adminNotes": "Item suspended for policy violation."
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Report status updated successfully.",
    "data": {
      "report": {
        "_id": "67210a...",
        "status": "resolved",
        "resolutionAction": "SUSPEND_LISTING",
        "adminNotes": "Item suspended for policy violation.",
        "resolvedBy": "671fb2...",
        "resolvedAt": "2026-10-28T22:15:00.000Z"
      }
    }
  }
  ```

---

## 10. Cart Module (`/api/cart`)

### `GET /api/cart`
Returns the authoritative cart for the authenticated user or guest session with calculated monetary totals in integer paise.
- **Auth Required:** Optional (supports `Authorization: Bearer <token>` or `x-guest-id: <guestId>`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "items": [
        {
          "listing": {
            "_id": "671fb9...",
            "title": "Macroeconomics 10th Ed",
            "pricePaise": 25000,
            "images": ["/img.jpg"]
          },
          "quantity": 1,
          "pricePaise": 25000,
          "itemTotalPaise": 25000
        }
      ],
      "totals": {
        "subtotalPaise": 25000,
        "shippingPaise": 4900,
        "totalPaise": 29900,
        "isFreeShipping": false,
        "amountNeededForFreeShippingPaise": 24900
      }
    }
  }
  ```

### `POST /api/cart/items`
Adds a listing item to the cart.
- **Request Body:** `{ "listingId": "671fb9...", "quantity": 1 }`
- **Success Response (`200 OK`):** Same envelope as `GET /api/cart`.

### `PATCH /api/cart/items`
Updates quantity of an item in the cart.
- **Request Body:** `{ "listingId": "671fb9...", "quantity": 2 }`

### `DELETE /api/cart/items/:listingId`
Removes an item from the cart.

### `DELETE /api/cart`
Clears all items from the active cart.

### `POST /api/cart/merge`
Merges guest cart items into the authenticated user cart upon login.
- **Auth Required:** Yes (`requireAuthentication`)
- **Request Body:** `{ "guestId": "gst_..." }`

---

## 11. Delivery Address Module (`/api/addresses`)

### `GET /api/addresses`
Returns all delivery addresses belonging to the authenticated user.
- **Auth Required:** Yes (`requireAuthentication`)

### `POST /api/addresses`
Creates a delivery address validated with Indian mobile (`^[6-9]\d{9}$`) and 6-digit PIN code (`^\d{6}$`).
- **Auth Required:** Yes (`requireAuthentication`)
- **Request Body:**
  ```json
  {
    "fullName": "Aarav Sharma",
    "phone": "9876543210",
    "street": "Room 304, Satpura Hostel",
    "city": "New Delhi",
    "state": "Delhi",
    "postalCode": "110016",
    "isDefault": true
  }
  ```

---

## 12. Checkout & Payment Module (`/api/orders`, `/api/payments`)

### `POST /api/orders/checkout`
Idempotently initiates checkout, reserves stock for 15 minutes, validates COD cap (₹5,000 / 500,000 paise), and returns Razorpay order details or COD confirmation.
- **Auth Required:** Yes (`requireAuthentication`)
- **Headers:** `Idempotency-Key: <unique-uuid>` (optional but recommended)
- **Request Body:**
  ```json
  {
    "addressId": "67210b...",
    "paymentMethod": "COD"
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "message": "Order created successfully",
    "data": {
      "order": {
        "_id": "67210c...",
        "orderStatus": "CONFIRMED",
        "paymentStatus": "UNPAID",
        "fulfillmentStatus": "UNFULFILLED",
        "subtotalPaise": 25000,
        "shippingPaise": 4900,
        "totalPaise": 29900
      },
      "requiresPayment": false
    }
  }
  ```

### `POST /api/orders/confirm-payment`
Verifies Razorpay HMAC SHA-256 signature and transitions order to `paymentStatus: 'PAID'`.
- **Request Body:** `{ "orderId": "...", "razorpayPaymentId": "...", "razorpayOrderId": "...", "razorpaySignature": "..." }`

### `PATCH /api/orders/:id/cancel`
Cancels unfulfilled order and releases inventory reservation. Pre-shipment cancellations are strictly enforced.

### `POST /api/payments/webhook`
Webhook endpoint receiving raw-body Razorpay events (`payment.captured`, `payment.failed`, `refund.processed`). Handles signature verification and idempotency.

---

## 13. Admin Order Management (`/api/admin/orders`)

### `GET /api/admin/orders`
Retrieves paginated orders with fulfillment and payment status filters.
- **Auth Required:** Yes (`requireAuthentication` + `requireAdmin`)

### `PATCH /api/admin/orders/:id/fulfillment`
Updates fulfillment status (`PACKED`, `SHIPPED`, `DELIVERED`, `RTO`) and logs immutable status history.
- **Auth Required:** Yes (`requireAuthentication` + `requireAdmin`)




# ThriftSync — Security Requirements & Policy

This document defines the production-grade security architecture, compliance standards, and defensive controls implemented across ThriftSync.

---

## 1. Authentication & Password Security
- **Password Hashing:** Passwords are mathematically hashed using `bcryptjs` with a work factor of at least 10 salt rounds (`bcrypt.genSalt(10)` -> `bcrypt.hash`). Plaintext passwords must never be stored, logged, or serialized.
- **Query Projection:** The `password` field on the User schema enforces `select: false`. It must be explicitly requested via `.select('+password')` solely during authentication routines.
- **Serialization Safety:** The User model's `toJSON` transform automatically strips `password` and `__v` to prevent accidental credential leakage in API payloads.
- **Token Security:** Authentication utilizes JSON Web Tokens (JWT) signed with a secure secret key (`JWT_SECRET`) and strict expiration times (`JWT_EXPIRES_IN=7d`).
- **Session Verification:** The `requireAuthentication` middleware validates the signature, expiration, and ensures the referenced user account still exists and remains active (`isActive: true`).

---

## 2. Role-Based Access Control (RBAC) & User Data Isolation
- **Server-Side Authority:** Role-based access control (RBAC) is strictly evaluated on the server. Client-provided `role` fields in registration payloads are discarded; all public signups default strictly to `student`.
- **Administrative Route Protection:** All `/api/admin/*` routes enforce both `requireAuthentication` and `requireAdmin` middleware, immediately rejecting normal students and standard users with `403 Forbidden`. Normal users cannot escalate privileges.
- **User Data Isolation:** Users are constrained to their own data:
  - Profile updates (`PUT /api/users/profile`) strictly modify `req.user._id`.
  - Listing modifications and deletions require `listing.seller.toString() === req.user._id.toString() || req.user.role === 'admin'`.
  - Swap operations (accept, counter, withdraw, confirm handover) strictly verify the participant's turn and user identity.
- **Sanitized Public Profiles:** Public peer endpoints (`/api/users/:id/public`) strip all private attributes (`email`, `role`, `isActive`, `password`), returning only public identifiers.

---

## 3. API, Form & Network Security
- **Security Headers (Helmet):** Express is secured with `helmet()` middleware, establishing defense-in-depth HTTP headers:
  - `Content-Security-Policy` (CSP)
  - `Strict-Transport-Security` (HSTS)
  - `X-Frame-Options: SAMEORIGIN` (Clickjacking mitigation)
  - `X-Content-Type-Options: nosniff` (MIME-type sniffing mitigation)
  - Suppression of `X-Powered-By: Express`
- **Rate Limiting (`express-rate-limit`):**
  - Sensitive auth endpoints (`/api/auth/login`, `/api/auth/register`): Protected by `authLimiter` (max 20 attempts per 15 minutes per IP) to prevent brute-force and credential stuffing.
  - Resource creation (`POST /api/listings`, `POST /api/swaps`): Protected by `creationLimiter` (max 60 creations per hour per IP) to prevent spam floods.
  - Global API (`/api`): Protected by `apiLimiter` (max 300 requests per 15 minutes per IP) for DDoS mitigation.
- **Input Sanitization & Injection Defense:**
  - `sanitizeInput` middleware recursively strips keys beginning with `$` or containing `.` from request bodies, queries, and params, neutralizing NoSQL query operator injection.
  - Malicious script tags (`<script>...</script>`) are automatically stripped from string values to mitigate stored and reflected XSS.
  - Strict Zod schemas validate type constraints and reject unexpected payloads before execution.

---

## 4. Environment & Secrets Management
- **Environment Isolation:** Sensitive configurations (`PORT`, `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_*`) are strictly loaded via `.env` files via `dotenv`.
- **Git Protection:** `.gitignore` strictly excludes `.env` and `.env.*` (preserving only safe `.env.example` templates).
- **No Hardcoded Secrets:** Zero secrets or production credentials exist in application code or repositories.

---

## 5. Operational Hygiene & Production Masking
- **Console Log Stripping:** Vite and esbuild are configured to drop `console` and `debugger` statements from production builds (`esbuild: { drop: ['console', 'debugger'] }`), preventing accidental client-side token or payload leakage.
- **Production Error Masking:** Centralized error handling (`handleErrors` middleware) logs actual stack traces and error details only to the server console. Clients receive safe, generic messages for 500 errors in production (`"An unexpected internal server error occurred."`), with stack traces withheld.
- **Payload Size Limits:** `express.json({ limit: '1mb' })` and `express.urlencoded({ limit: '1mb' })` mitigate memory exhaustion attacks.

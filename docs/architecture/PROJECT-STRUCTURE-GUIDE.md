# ThriftSync — Project Structure Guide

## 1. Purpose of This Document

This document explains the responsibility of every planned project directory
and named source file, where new code belongs, and how the modules connect.

This is an architecture guide, not proof that every feature is implemented.
A placeholder file may exist before it contains working code.

## 2. Root Directory

- `AGENTS.md`: Instructions for coding agents. Defines project goals,
  implementation rules, naming conventions, security constraints and
  documentation requirements.
- `README.md`: Human-readable project introduction, prerequisites, setup,
  development commands and current implementation status.
- `.gitignore`: Files and generated artifacts that Git must not track.
- `package.json`: Root-level scripts and orchestration only. Keep frontend
  and backend dependencies in their respective package manifests.
- `client/`: Browser-facing React application.
- `server/`: Node.js API, domain logic and database integration.
- `docs/`: Requirements, architecture, system design and technical decisions.
- `tests/`: Cross-module integration and end-to-end tests.

## 3. Client — Frontend Application

### `client/public/`

Static files served directly by the web server.

- `fonts/`: Licensed or approved font files.
- `images/`: Static public images, logos and fallback assets that do not
  need to be imported and bundled through application code.

Do not place private uploads, credentials or user-specific files here.

### `client/src/app/`

Application initialization and composition.

- `App.jsx`: Top-level application component and shared application shell.
- `routes.jsx`: Route definitions and page-to-URL mapping.
- `providers.jsx`: Shared React providers, if needed, such as application-wide
  context providers. Do not add unused providers.

### `client/src/assets/`

Bundled assets imported by components, including local SVGs and design assets.

### `client/src/components/`

Reusable presentation components that are not owned exclusively by one feature.

- `buttons/`: Reusable buttons and action controls.
- `forms/`: Reusable form fields and input components.
- `feedback/`: Alerts, loading indicators, empty states and error messages.
- `navigation/`: Shared navigation elements and navigation controls.
- `layout/`: Reusable layout primitives, containers and shared visual structure.

Feature-specific components should normally stay inside their feature folder.

### `client/src/features/`

Business-feature code. Keep each feature's UI, state, validation and API
integration together when the feature needs those responsibilities.

- `authentication/`: Registration, login, logout and session-related UI.
- `marketplace/`: Search, category filters, sorting and listing discovery.
- `listings/`: Listing creation, editing, images and listing-status displays.
- `cart/`: Cart items, cart state and client-side bill presentation.
- `checkout/`: Pickup details, checkout forms and order-submission UI.
- `orders/`: Order history, status and order-detail views.
- `rentals/`: Rental periods, due dates, return status and deposit information.
- `swaps/`: Swap requests, responses and exchange-status UI.
- `reviews/`: Ratings, review forms and verified-review presentation.
- `administration/`: Admin-specific moderation, user management and analytics UI.

Do not put trusted authorization or authoritative pricing rules only in the
frontend. The server must validate those rules independently.

### `client/src/pages/`

Route-level page components.

- `HomePage.jsx`: Homepage and introduction to ThriftSync.
- `MarketplacePage.jsx`: Searchable and filterable marketplace.
- `ProductDetailsPage.jsx`: Details and available actions for one listing.
- `LoginPage.jsx`: User login interface.
- `RegisterPage.jsx`: User registration interface.
- `CartPage.jsx`: Current cart and item-level totals.
- `CheckoutPage.jsx`: Pickup selection and order submission.
- `MyOrdersPage.jsx`: User order history and order status.
- `MyListingsPage.jsx`: Listings created by the current user.
- `CreateListingPage.jsx`: Form for creating a listing.
- `MyRentalsPage.jsx`: Rental history, due dates and return status.
- `MySwapsPage.jsx`: Sent and received swap requests.
- `AdminDashboardPage.jsx`: Administrative overview and entry point.

A page composes feature components. Avoid putting every business rule and
every API call directly inside a large page component.

### `client/src/layouts/`

- `CustomerLayout.jsx`: Shared marketplace layout, customer navigation and
  common page regions.
- `AdminLayout.jsx`: Shared administrative navigation and admin page layout.

These layouts control presentation, not the final security boundary.

### `client/src/services/`

- `apiClient.js`: Shared HTTP client configuration, API base URL and
  appropriate request/response handling.

Feature-specific API functions may live with their feature when that makes
ownership clearer. Do not create duplicate HTTP clients without a reason.

### `client/src/hooks/`

Reusable React hooks for shared behavior, such as debounced input or
reduced-motion preference detection.

### `client/src/utils/`

Small reusable frontend utilities, formatting functions and pure helpers.
Business-critical totals must still be validated by the server.

### `client/src/styles/`

- `global.css`: Global styles, design tokens, typography defaults and
  shared CSS rules. Avoid duplicating component-specific styling here.

### `client/src/animations/`

Organized location for animation-related implementation.

- `transitions/`: Reusable page and component transition definitions.
- `scroll-effects/`: Scroll-triggered reveal behavior and related utilities.
- `3d-scenes/`: Reusable 3D scene components and scene composition.
- `3d-models/`: Model loading and model-related components.
- `3d-materials/`: Reusable materials and surface definitions.
- `3d-lights/`: Scene lighting configurations.
- `3d-controls/`: Camera and user-interaction controls.
- `3d-utils/`: Shared 3D helpers.

Do not create empty implementations merely to fill these folders.
Use CSS or Framer Motion for suitable UI effects. Choose a 3D library only
after the actual scene requirements, bundle size and performance costs
have been reviewed.

### Other client files

- `main.jsx`: Browser entry point that mounts the React application.
- `index.html`: HTML shell, document metadata and browser title.
- `vite.config.js`: Vite development server and build configuration.
- `package.json`: Frontend dependencies and frontend scripts.
- `.env.example`: Names and safe example values for frontend environment
  variables. Never put real secrets in this file.
- `tests/`: Frontend component and interaction tests.

## 4. Server — Backend Application

### `server/src/config/`

- `database.js`: MongoDB connection configuration and connection lifecycle.
- `imageStorage.js`: Image-storage provider configuration and integration.

External service credentials must come from environment variables.

### `server/src/middleware/`

- `requireAuthentication.js`: Verifies the authenticated user.
- `requireAdmin.js`: Enforces administrator authorization.
- `validateRequest.js`: Validates request input against defined schemas.
- `handleErrors.js`: Converts application errors into consistent API responses.

Authorization must be checked on the server, not inferred from the frontend.

### `server/src/modules/`

Each module owns a specific backend business capability. As a module grows,
use descriptive files for its routes, controller/handler, service, model
and validation schemas. Do not create every file type if it is unnecessary.

- `authentication/`: Registration, login and authentication logic.
- `users/`: User profiles, account status and user-related operations.
- `listings/`: Listing creation, editing, images and moderation state.
- `marketplace/`: Public discovery, search, filters and sorting.
- `cart/`: Cart persistence and cart operations.
- `checkout/`: Checkout validation and order-creation coordination.
- `orders/`: Order lifecycle, item snapshots and handover status.
- `rentals/`: Rental lifecycle, due dates, returns and deposit settlement.
- `swaps/`: Swap requests, acceptance and exchange completion.
- `reviews/`: Review eligibility, ratings and review persistence.
- `payments/`: Payment-provider integration, webhooks and reconciliation.
- `administration/`: Administrative statistics, moderation and dispute handling.

Keep HTTP handling, business rules and persistence responsibilities separate
where the complexity justifies it. Do not create unnecessary abstractions.

### Other server files

- `app.js`: Creates and configures the Express application, middleware and
  route mounting. It should be testable without automatically opening a port.
- `server.js`: Starts the HTTP server and handles startup and shutdown.
- `utils/`: Small shared backend utilities that are not owned by one module.
- `package.json`: Backend dependencies and scripts.
- `.env.example`: Safe placeholders for port, database URI, token secrets and
  external integrations.
- `tests/unit/`: Tests for isolated business logic and utilities.
- `tests/integration/`: Tests involving routes, database behavior and module
  interactions.

## 5. Documentation

### `docs/requirements/`

- `PRODUCT-REQUIREMENTS.md`: Business goals, users, feature scope and rules.
- `ACCEPTANCE-CRITERIA.md`: Testable conditions that determine whether
  a feature is complete.

### `docs/architecture/`

- `README.md`: Architecture overview and links to important design documents.
- `FOLDER-STRUCTURE.md`: Concise directory map.
- `PROJECT-STRUCTURE-GUIDE.md`: Detailed explanation of folders, files,
  responsibilities and where new code belongs.

### `docs/system-design/`

- `high-level-design/HLD.md`: System components, boundaries and integrations.
- `low-level-design/LLD.md`: Detailed module behavior, entities and interfaces.
- `data-flows/AUTHENTICATION-FLOW.md`: Registration and login lifecycle.
- `data-flows/LISTING-APPROVAL-FLOW.md`: Submission, moderation and publishing.
- `data-flows/BUY-AND-CHECKOUT-FLOW.md`: Cart, inventory reservation and orders.
- `data-flows/RENTAL-AND-RETURN-FLOW.md`: Rental duration, returns and deposits.
- `data-flows/SWAP-FLOW.md`: Swap request and exchange lifecycle.

### `docs/database/`

- `DATABASE-SCHEMA.md`: Collections, fields, indexes, relationships and
  data-integrity constraints.

### `docs/api/`

- `API-CONTRACTS.md`: Endpoint purpose, authentication requirements, request
  schemas, response shapes, status codes and error formats.

### `docs/security/`

- `SECURITY-REQUIREMENTS.md`: Threat considerations, permissions, data
  protection and security acceptance criteria.

### `docs/3d-animation/`

- `README.md`: Overview of the 3D and motion documentation.
- `visual-direction/VISUAL-REFERENCE.md`: Intended visual style and approved
  references.
- `scene-design/SCENE-PLAN.md`: Scene purpose, composition, camera, lighting,
  interactions and asset requirements.
- `performance/ANIMATION-PERFORMANCE.md`: Asset budgets, loading strategy,
  mobile performance and reduced-motion behavior.

### `docs/implementation/`

- `IMPLEMENTATION-PLAN.md`: Phases, dependencies, milestones and verification
  criteria.

## 6. Tests

- `client/tests/`: Frontend-specific component and interaction tests.
- `server/tests/unit/`: Isolated backend unit tests.
- `server/tests/integration/`: Backend API and database integration tests.
- `tests/integration/`: Cross-feature workflows.
- `tests/e2e/`: Browser-level tests for important user journeys.

Keep tests close to their owning application where practical. Use root-level
tests for workflows that cross application boundaries.

## 7. How a Request Moves Through the System

Example: browsing a listing.

1. The user opens `MarketplacePage.jsx`.
2. Marketplace feature components collect search and filter inputs.
3. The frontend API client sends a request to the server.
4. The marketplace backend validates and processes the query.
5. MongoDB returns matching approved, available listings.
6. The API returns a defined response shape.
7. The UI displays results, loading states or meaningful empty/error states.

Example: purchasing a listing.

1. The user selects an available listing.
2. The cart displays an estimated total.
3. Checkout submits the selected items and necessary information.
4. The server validates prices, eligibility and availability.
5. Inventory is reserved safely and an order is created.
6. Payment status is verified through the configured payment flow.
7. The order lifecycle updates according to confirmed events.

A cart entry alone does not mark a product as sold. Conflicting checkouts
must be prevented by server-side inventory and transaction rules.

## 8. Naming and Ownership Rules

- React components and pages use descriptive PascalCase names.
- Utility, service and middleware files use descriptive camelCase names.
- Backend modules use domain names rather than arbitrary abbreviations.
- Each business rule should have one authoritative implementation.
- Shared UI belongs in `components/`; feature-specific UI belongs in `features/`.
- Route-level composition belongs in `pages/`.
- Server authorization and business rules belong on the server.
- Requirements and design decisions belong in documentation.
- Do not create empty files just to make the folder tree look complete.
- Before creating a new file, search for an existing owner of the same
  responsibility.
- When the architecture changes, update this guide and the relevant design
  documents together.

## 9. Current Status and Verification

This guide describes the intended architecture. It does not certify that
the listed files contain implementations or that all integrations work.

Before changing code:
1. Inspect the actual repository and Git status.
2. Compare existing files with this guide.
3. Identify missing, implemented and conflicting components.
4. Propose any structural migration before moving or deleting existing files.
5. Run the relevant tests and build checks after implementation.
6. Report verified results and incomplete functionality accurately.

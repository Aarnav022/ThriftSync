# ThriftSync — Agent Instructions

## Project purpose
Build a premium, responsive campus and local-community marketplace for buying,
selling, renting, swapping and upcycling pre-owned clothes, books and relevant
accessories.

## Core rules
- Inspect the repository before making changes.
- Preserve existing working functionality.
- Use readable, responsibility-based folder and file names.
- Do not overwrite or delete existing files without authorization.
- Do not invent products, sellers, testimonials, reviews, prices, statistics
  or environmental impact claims.
- Every visible control must perform its advertised action.
- Do not represent demo data or mock integrations as production functionality.
- Keep frontend, backend, domain logic and documentation clearly separated.
- Validate input and enforce authorization on the server.
- Never expose passwords, tokens, secrets or private pickup information.
- Protect inventory against conflicting purchases and rentals.
- Track rental charges and refundable deposits separately.
- Verify payment status before reporting a successful payment.
- Respect accessibility, responsive design and reduced-motion preferences.
- Do not install animation libraries without a demonstrated requirement.
- Do not perform destructive operations without explicit approval.

## Preferred technology
Frontend: React, Vite, JavaScript, Tailwind CSS, React Router.
Backend: Node.js, Express, MongoDB and Mongoose.
Use existing compatible dependencies where available.

## Design direction
Use the ThriftSync sustainable editorial palette:
- Background: #F7F5F0
- Surface: #EFECE6
- Text: #141413
- Sustainability accent: #1E4D2B
- Rental accent: #D95D39

Animations must improve the experience rather than distract from usability.
3D technology is not finalized; document and validate its purpose before
selecting libraries or implementing scenes.

## Documentation
Maintain requirements in docs/requirements/.
Maintain architecture in docs/architecture/.
Maintain HLD, LLD and workflows in docs/system-design/.
Maintain database and API contracts in docs/database/ and docs/api/.
Maintain 3D direction, scenes and performance constraints in docs/3d-animation/.

## Implementation process
1. Audit the existing repository.
2. Confirm architecture and data contracts.
3. Implement the smallest coherent change.
4. Run relevant tests and build checks.
5. Report changed files, actual results and remaining limitations.

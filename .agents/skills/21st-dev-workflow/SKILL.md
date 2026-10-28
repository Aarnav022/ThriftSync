---
name: 21st-dev-workflow
description: >-
  Approval-first workflow for discovering, evaluating, vetting, and integrating 21st.dev UI components into ThriftSync.
  Enforces a strict two-gate human approval process, distinguishes verified CLI results from public-catalog discoveries,
  preserves React 19 JavaScript and Tailwind styling, and ensures zero unvetted modifications to the codebase.
---

# 21st.dev Approval-First Component Workflow for ThriftSync

This skill governs how AI coding agents browse, select, vet, and install UI components from [21st.dev](https://21st.dev) into the ThriftSync codebase.

## Core Rules & Invariants

1. **Strict 2-Gate Approval:**
   * **Gate 1 (Selection):** Present 3 curated component options. **WAIT** for the user's explicit choice before preparing code.
   * **Gate 2 (Implementation):** Present the exact file diff, dependency additions, and adaptation plan. **WAIT** for the user's explicit approval before touching any files or running package managers.
2. **Transparent Provenance:**
   * Always classify components as either:
     - `[Verified 21st.dev CLI]`: Retrieved via authenticated `@21st-dev/cli` session.
     - `[Public 21st.dev Catalog]`: Discovered via public web catalog/repository.
     - `[Fallback Recommendation]`: Suggested alternative when direct 21st.dev matches are unavailable.
   * Never represent an unverified component as directly importable.
3. **Safe Authentication (No Secrets in Chat):**
   * Never ask the user to paste API keys, tokens, or credentials into chat.
   * Never write or commit tokens into `.env`, code, or configuration files.
   * If authentication is needed, instruct the user to run `21st login` in their local terminal or export `TWENTYFIRST_TOKEN` / `API_KEY_21ST` in their system environment.
4. **Stack & Design System Preservation:**
   * **Framework:** React 19 (`^19.0.0`), Vite 6 (`^6.2.0`), React Router 7 (`^7.2.0`).
   * **Language:** JavaScript (`.jsx`). Transpile and strip all TypeScript types/interfaces before integrating.
   * **Styling:** Tailwind CSS v3 (`^3.4.17`) with `components.json` path aliasing (`@/components/ui`, `@/lib/utils`).
   * **Design Palette:** Always adapt component colors to ThriftSync's editorial tokens:
     - Background: `#F7F5F0`
     - Surface: `#EFECE6`
     - Text / Charcoal: `#141413`
     - Sustainability accent (primary): `#1E4D2B`
     - Rental accent (secondary): `#D95D39`
     - Muted: `#E5E2DC` / `#57534E`
   * **Backend & Existing UI:** Never modify `server/`, database models, authentication, or existing UI components in `client/src/components/ui/` unless explicitly requested.

---

## Workflow Procedures

### Phase 1: Authentication & Source Detection

Before searching, check whether the 21st CLI environment is authenticated:

```powershell
npx --yes @21st-dev/cli whoami
```

* **If Authenticated:**
  - Proceed with CLI commands: `npx @21st-dev/cli search "<query>" --limit 5 --json`.
  - Tag results as `[Verified 21st.dev CLI]`.
* **If Not Authenticated (`Not logged in`):**
  - Inform the user:
    > "21st.dev CLI is currently unauthenticated. You can log in via your own terminal using `21st login` or by setting the `TWENTYFIRST_TOKEN` environment variable. Never share your key in chat. For now, proceeding with public-catalog discovery."
  - Use public search or catalog lookup. Tag results as `[Public 21st.dev Catalog]`.

---

### Phase 2: Gate 1 — Presenting 3 Options (Approval Gate 1)

When a user requests a UI component, find candidate components and present **exactly 3 curated options** using this structured layout:

#### Option Layout Template:

```markdown
### Option 1: <Component Name>
* **Author / Slug:** `<author>/<slug>`
* **Source:** `[Verified 21st.dev CLI]` OR `[Public 21st.dev Catalog]`
* **Official Preview Link:** https://21st.dev/<author>/<slug>
* **Preview Notice:** Visual previews must be viewed in your browser using the official link above (interactive iframes are not executable inside the AI chat interface).
* **Dependencies:** (e.g., `lucide-react`, `framer-motion`, `@radix-ui/react-slider`)
* **Expected Files Affected:**
  - `client/src/components/ui/<component-name>.jsx` (New file)
  - `client/tailwind.config.js` (Optional animation/keyframes additions)
* **ThriftSync Adaptations:** (e.g., Strip TypeScript annotations to `.jsx`, map accent colors to `#1E4D2B` and `#D95D39`)
```

> [!IMPORTANT]
> **GATE 1 PAUSE:** After presenting the 3 options, stop and ask the user which option they want to select (or if they want alternative options). **Do not generate integration code, write files, or install packages until the user makes an explicit choice.**

---

### Phase 3: Gate 2 — Implementation & Adaptation Plan (Approval Gate 2)

Once the user selects an option:

1. **Obtain Component Source:**
   * If authenticated: Run `npx @21st-dev/cli get <id> --json` or inspect the component JSON.
   * If public: Retrieve the verified implementation.
2. **Prepare Adaptation:**
   * Transpile TypeScript (`.tsx`) into clean JavaScript (`.jsx`).
   * Replace generic Tailwind color classes (e.g. `bg-blue-600`, `text-emerald-500`) with ThriftSync design tokens (`bg-sustainability`, `text-rental`, `bg-surface`, `text-text`).
   * Verify compatibility with React 19 (e.g., ensure ref handling and hook compatibility).
3. **Present the Plan to the User:**
   * Complete source code for `client/src/components/ui/<name>.jsx`.
   * Exact package install command (if new dependencies are needed, e.g. `npm --prefix client install <package>`).
   * Exact updates to `client/tailwind.config.js` (if new animations/keyframes are needed).
   * Planned validation checks (`npm run client:test`, `npm run client:build`).

> [!IMPORTANT]
> **GATE 2 PAUSE:** Stop and ask the user for explicit approval to apply the changes. **Do not modify files until the user explicitly responds with approval (e.g., "approve", "proceed", "apply").**

---

### Phase 4: Safe Execution & Quality Verification

Only after Gate 2 approval is granted:

1. **Install Dependencies (if any):**
   ```powershell
   npm --prefix client install <approved-package>
   ```
2. **Write Component:**
   * Create the component file under `client/src/components/ui/<component-name>.jsx`.
   * Apply any necessary styling extensions to `client/tailwind.config.js`.
3. **Run Quality Verification:**
   ```powershell
   npm run client:test
   npm run client:build
   ```
4. **Final Summary:**
   * Report changed and created files.
   * Report test results and production build status.
   * Provide an example of how to import and use the new component within a ThriftSync page or layout.

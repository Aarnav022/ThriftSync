# ThriftSync — Circular Student Swap Lifecycle & Data Flow

This document specifies the authoritative lifecycle, state transitions, concurrency safeguards, and handover confirmation workflow for ThriftSync's circular swap exchanges.

---

## 1. Lifecycle State Machine

```
              ┌──────────────┐
              │   PENDING    │◄──────────────┐
              └──────┬───────┘               │
                     │                       │
      ┌──────────────┼──────────────┐        │
      ▼              ▼              ▼        │
┌───────────┐  ┌───────────┐  ┌───────────┐  │
│ WITHDRAWN │  │ REJECTED  │  │ COUNTERED ├──┘
└───────────┘  └───────────┘  └─────┬─────┘
                                    │
                                    ▼
                             ┌─────────────┐
                             │  ACCEPTED   │
                             └──────┬──────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
              ┌─────────────┐               ┌─────────────┐
              │  CANCELLED  │               │  COMPLETED  │
              └─────────────┘               └─────────────┘
```

### 1.1 State Definitions
* **`PENDING`**: Initial proposal submitted by the proposer. Awaiting recipient review.
* **`COUNTERED`**: Recipient (or proposer) submitted a revised proposal offering a different item or altered terms.
* **`ACCEPTED`**: The party receiving the current proposal accepted the terms. Both listings are atomically transitioned to `status: 'reserved'`.
* **`REJECTED`**: Proposal rejected by the receiving party. Listings remain `status: 'active'`.
* **`WITHDRAWN`**: Proposal cancelled by the offering party prior to acceptance. Listings remain `status: 'active'`.
* **`CANCELLED`**: An accepted exchange cancelled prior to physical handover completion. Both listings revert from `'reserved'` to `'active'`.
* **`COMPLETED`**: Physical exchange finished. Both participants independently confirmed handover. Both listings transition to `'archived'`.

---

## 2. Permitted State Transitions & Authorization Rules

| Current State | Target State | Permitted Actor | Pre-Conditions & Actions |
|---|---|---|---|
| *(New)* | `PENDING` | Authenticated student (Proposer) | Must own offered listing (`status: 'active'`). Requested listing must exist (`status: 'active'`) and belong to a different student. |
| `PENDING` | `ACCEPTED` | Recipient | Both listings atomically transition to `status: 'reserved'`. |
| `PENDING` | `REJECTED` | Recipient | Rejection reason optional. Proposal marked terminal. |
| `PENDING` | `COUNTERED` | Recipient | Must submit new terms / item. Logged in proposal counter-offer history. |
| `PENDING` | `WITHDRAWN` | Proposer | Proposer retracts before acceptance. |
| `COUNTERED` | `ACCEPTED` | Party receiving counter-offer | Both listings atomically transition to `status: 'reserved'`. |
| `COUNTERED` | `REJECTED` | Party receiving counter-offer | Counter-offer rejected. |
| `COUNTERED` | `COUNTERED` | Party receiving counter-offer | Subsequent counter-offer appended to history. |
| `COUNTERED` | `WITHDRAWN` | Party who sent last counter | Retracts active counter-offer. |
| `ACCEPTED` | `COMPLETED` | Proposer AND Recipient | Requires **both** participants to independently invoke `POST /api/swaps/:id/confirm-handover`. Once both flags are true, listings transition to `status: 'archived'`. |
| `ACCEPTED` | `CANCELLED` | Proposer OR Recipient | Reason mandatory. Releases listing locks (reverts both items to `status: 'active'`). |

---

## 3. Concurrency & Inventory Protection Strategy

To prevent conflicting swaps and race conditions where two users attempt to accept proposals involving the same item:

1. **Atomic Conditional Reservation:**
   When `acceptProposal` is executed:
   - The server initiates an atomic conditional update on both the offered and requested listings:
     ```javascript
     Listing.findOneAndUpdate({ _id: listingId, status: 'active' }, { status: 'reserved' });
     ```
2. **Conflict Handling & Rollback:**
   - If either item fails to update (e.g. already reserved, sold, or modified concurrently), the operation immediately aborts with `409 Conflict`.
   - If the first listing was locked before the second failed, the server immediately releases the first lock, rolling it back to `status: 'active'`.
3. **Dual Handover Confirmation:**
   - Acceptance does NOT complete the exchange.
   - Physical exchange safety requires independent bilateral verification (`proposerConfirmedHandover` and `recipientConfirmedHandover`).
   - Only when both flags are confirmed does the swap transition to `COMPLETED`.

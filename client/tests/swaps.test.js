import { describe, it, expect } from 'vitest';

describe('Circular Student Swaps Logic & State Verification', () => {
  it('identifies completion condition requiring bilateral handover confirmations', () => {
    const isSwapComplete = (handover) =>
      Boolean(handover?.proposerConfirmed && handover?.recipientConfirmed);

    // Initial state: neither confirmed
    expect(isSwapComplete({ proposerConfirmed: false, recipientConfirmed: false })).toBe(false);

    // Proposer confirmed only
    expect(isSwapComplete({ proposerConfirmed: true, recipientConfirmed: false })).toBe(false);

    // Recipient confirmed only
    expect(isSwapComplete({ proposerConfirmed: false, recipientConfirmed: true })).toBe(false);

    // Both confirmed independently -> COMPLETED
    expect(isSwapComplete({ proposerConfirmed: true, recipientConfirmed: true })).toBe(true);
  });

  it('correctly maps allowed user actions according to lifecycle status and turn', () => {
    const getPermittedActions = (status, isUserTurn, isProposer) => {
      const actions = [];
      if (status === 'PENDING' || status === 'COUNTERED') {
        if (isUserTurn) {
          actions.push('accept', 'counter', 'reject');
        } else {
          actions.push('withdraw');
        }
      } else if (status === 'ACCEPTED') {
        actions.push('confirm_handover', 'cancel');
      }
      return actions;
    };

    // When proposal is pending and it is recipient's turn:
    const recipientPendingActions = getPermittedActions('PENDING', true, false);
    expect(recipientPendingActions).toContain('accept');
    expect(recipientPendingActions).toContain('counter');
    expect(recipientPendingActions).toContain('reject');
    expect(recipientPendingActions).not.toContain('withdraw');

    // When proposal is pending and it is proposer's turn (waiting for peer):
    const proposerPendingActions = getPermittedActions('PENDING', false, true);
    expect(proposerPendingActions).toContain('withdraw');
    expect(proposerPendingActions).not.toContain('accept');

    // When proposal is accepted:
    const acceptedActions = getPermittedActions('ACCEPTED', false, true);
    expect(acceptedActions).toContain('confirm_handover');
    expect(acceptedActions).toContain('cancel');
  });

  it('rejects self-swapping item proposals', () => {
    const validateSwapEligibility = (proposerId, recipientId, offeredItemId, requestedItemId) => {
      if (proposerId === recipientId) {
        return { valid: false, error: 'Cannot swap with yourself' };
      }
      if (offeredItemId === requestedItemId) {
        return { valid: false, error: 'Cannot offer and request the same item' };
      }
      return { valid: true };
    };

    expect(
      validateSwapEligibility('user-1', 'user-1', 'item-a', 'item-b').valid
    ).toBe(false);

    expect(
      validateSwapEligibility('user-1', 'user-2', 'item-a', 'item-a').valid
    ).toBe(false);

    expect(
      validateSwapEligibility('user-1', 'user-2', 'item-a', 'item-b').valid
    ).toBe(true);
  });
});

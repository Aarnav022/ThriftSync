import { describe, it, expect } from 'vitest';

describe('Campus Rental Lifecycle & Deposit Accounting Verification', () => {
  it('correctly calculates rental duration units and fees across rental periods', () => {
    const calculateFee = (rate, period, startIso, endIso) => {
      const start = new Date(startIso);
      const end = new Date(endIso);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      let units = 1;
      if (period === 'per day') units = diffDays;
      else if (period === 'per week') units = Math.max(1, Math.ceil(diffDays / 7));
      else if (period === 'per month') units = Math.max(1, Math.ceil(diffDays / 30));
      else units = 1;

      return { units, totalFee: Math.round(rate * units * 100) / 100 };
    };

    // 14 days per week: 2 units * $10 = $20
    const weekResult = calculateFee(10, 'per week', '2026-11-01', '2026-11-15');
    expect(weekResult.units).toBe(2);
    expect(weekResult.totalFee).toBe(20);

    // 3 days per day: 3 units * $5 = $15
    const dayResult = calculateFee(5, 'per day', '2026-11-01', '2026-11-04');
    expect(dayResult.units).toBe(3);
    expect(dayResult.totalFee).toBe(15);

    // 60 days per month: 2 units * $25 = $50
    const monthResult = calculateFee(25, 'per month', '2026-11-01', '2026-12-31');
    expect(monthResult.units).toBe(2);
    expect(monthResult.totalFee).toBe(50);

    // Semester: fixed 1 unit
    const semesterResult = calculateFee(40, 'per semester', '2026-09-01', '2026-12-20');
    expect(semesterResult.units).toBe(1);
    expect(semesterResult.totalFee).toBe(40);
  });

  it('strictly maintains independent tracking of rental fees and refundable deposits', () => {
    const calculateTotalHandover = (rentalFee, depositAmount) => {
      expect(typeof rentalFee).toBe('number');
      expect(typeof depositAmount).toBe('number');
      return {
        rentalFee,
        refundableDeposit: depositAmount,
        totalDueAtHandover: rentalFee + depositAmount,
      };
    };

    const ledger = calculateTotalHandover(35, 50);
    expect(ledger.rentalFee).toBe(35);
    expect(ledger.refundableDeposit).toBe(50);
    expect(ledger.totalDueAtHandover).toBe(85);
  });

  it('requires bilateral handover confirmations from both renter and owner to activate rental', () => {
    const checkBilateralPickup = (handover) =>
      Boolean(handover?.pickupConfirmedByRenter && handover?.pickupConfirmedByOwner);

    // Neither confirmed
    expect(checkBilateralPickup({ pickupConfirmedByRenter: false, pickupConfirmedByOwner: false })).toBe(false);

    // Only renter confirmed
    expect(checkBilateralPickup({ pickupConfirmedByRenter: true, pickupConfirmedByOwner: false })).toBe(false);

    // Only owner confirmed
    expect(checkBilateralPickup({ pickupConfirmedByRenter: false, pickupConfirmedByOwner: true })).toBe(false);

    // Both confirmed independently -> ACTIVE
    expect(checkBilateralPickup({ pickupConfirmedByRenter: true, pickupConfirmedByOwner: true })).toBe(true);
  });

  it('correctly settles deposit refunds and itemized damage deductions upon return', () => {
    const settleDeposit = (depositAmount, depositAction, deduction = 0) => {
      if (depositAction === 'FULL_REFUND' || depositAmount === 0) {
        return {
          status: 'REFUNDED',
          refundAmount: depositAmount,
          deductionAmount: 0,
        };
      }
      if (depositAction === 'PARTIAL_REFUND') {
        const cappedDeduction = Math.min(depositAmount, Math.max(0, deduction));
        return {
          status: 'FORFEITED_PARTIAL',
          refundAmount: depositAmount - cappedDeduction,
          deductionAmount: cappedDeduction,
        };
      }
      return {
        status: 'FORFEITED_FULL',
        refundAmount: 0,
        deductionAmount: depositAmount,
      };
    };

    // Full refund: 100% returned
    const full = settleDeposit(50, 'FULL_REFUND');
    expect(full.status).toBe('REFUNDED');
    expect(full.refundAmount).toBe(50);
    expect(full.deductionAmount).toBe(0);

    // Partial refund with $15 deduction for repair
    const partial = settleDeposit(50, 'PARTIAL_REFUND', 15);
    expect(partial.status).toBe('FORFEITED_PARTIAL');
    expect(partial.refundAmount).toBe(35);
    expect(partial.deductionAmount).toBe(15);

    // Full forfeiture due to severe damage
    const fullForfeit = settleDeposit(50, 'NO_REFUND');
    expect(fullForfeit.status).toBe('FORFEITED_FULL');
    expect(fullForfeit.refundAmount).toBe(0);
    expect(fullForfeit.deductionAmount).toBe(50);
  });

  it('detects date overlaps preventing concurrent conflicting rentals', () => {
    const hasOverlap = (existingStart, existingEnd, newStart, newEnd) => {
      const eStart = new Date(existingStart).getTime();
      const eEnd = new Date(existingEnd).getTime();
      const nStart = new Date(newStart).getTime();
      const nEnd = new Date(newEnd).getTime();
      return eStart < nEnd && eEnd > nStart;
    };

    // Existing: Nov 10 to Nov 20
    const existing = { start: '2026-11-10', end: '2026-11-20' };

    // Conflicting request (Nov 15 to Nov 25)
    expect(hasOverlap(existing.start, existing.end, '2026-11-15', '2026-11-25')).toBe(true);

    // Completely inside existing (Nov 12 to Nov 18)
    expect(hasOverlap(existing.start, existing.end, '2026-11-12', '2026-11-18')).toBe(true);

    // Non-conflicting request before existing (Nov 01 to Nov 09)
    expect(hasOverlap(existing.start, existing.end, '2026-11-01', '2026-11-09')).toBe(false);

    // Non-conflicting request after existing (Nov 21 to Nov 30)
    expect(hasOverlap(existing.start, existing.end, '2026-11-21', '2026-11-30')).toBe(false);
  });
});

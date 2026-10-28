import Listing from '../listings/listingModel.js';
import Reservation from './reservationModel.js';
import COMMERCE_CONFIG from '../../config/commerceConfig.js';
import StatusHistory from '../orders/statusHistoryModel.js';

/**
 * Two-phase inventory reservation service
 * Invariant: totalStock = availableStock + reservedStock + soldStock
 */
export async function reserveStockForOrder({ orderId, items }) {
  const reservedItems = [];

  try {
    for (const item of items) {
      const listingId = item.listing?._id || item.listing || item.listingId;
      const quantity = item.quantity || 1;

      // Conditional atomic update: availableStock >= quantity
      const updatedListing = await Listing.findOneAndUpdate(
        {
          _id: listingId,
          availableStock: { $gte: quantity },
          status: { $in: ['active', 'reserved'] },
        },
        {
          $inc: {
            availableStock: -quantity,
            reservedStock: quantity,
          },
        },
        { new: true }
      );

      if (!updatedListing) {
        throw new Error(
          `INSUFFICIENT_STOCK: Item "${item.title || listingId}" is out of stock or insufficient quantity available.`
        );
      }

      // Record reserved item for compensation rollback if subsequent items fail
      reservedItems.push({
        listingId,
        quantity,
        sku: updatedListing.sku || item.sku || 'TS-ITEM',
      });
    }

    // Create reservation records with 15-minute expiry
    const expiresAt = new Date(Date.now() + COMMERCE_CONFIG.RESERVATION_EXPIRY_MS);
    const reservations = await Promise.all(
      reservedItems.map((item) =>
        Reservation.create({
          order: orderId,
          listing: item.listingId,
          sku: item.sku,
          quantity: item.quantity,
          status: 'PENDING',
          expiresAt,
        })
      )
    );

    // Record StatusHistory
    await StatusHistory.create({
      entityType: 'RESERVATION',
      entityId: orderId,
      field: 'reservationStatus',
      previousState: null,
      newState: 'PENDING',
      actorType: 'SYSTEM',
      reason: '15-minute checkout stock reservation created',
      metadata: { itemCount: items.length, expiresAt },
    });

    return reservations;
  } catch (error) {
    // Rollback any items reserved before the failure (atomic compensation)
    for (const item of reservedItems) {
      await Listing.updateOne(
        { _id: item.listingId },
        {
          $inc: {
            availableStock: item.quantity,
            reservedStock: -item.quantity,
          },
        }
      ).catch(() => {});
    }

    throw error;
  }
}

/**
 * Permanently commits reserved stock on verified payment success
 * Converts reservedStock -> soldStock without decrementing availableStock a second time
 */
export async function commitReservation(orderId) {
  const pendingReservations = await Reservation.find({
    order: orderId,
    status: 'PENDING',
  });

  if (!pendingReservations.length) return [];

  for (const res of pendingReservations) {
    await Listing.updateOne(
      { _id: res.listing },
      {
        $inc: {
          reservedStock: -res.quantity,
          soldStock: res.quantity,
        },
      }
    );

    res.status = 'COMMITTED';
    res.committedAt = new Date();
    await res.save();
  }

  await StatusHistory.create({
    entityType: 'RESERVATION',
    entityId: orderId,
    field: 'reservationStatus',
    previousState: 'PENDING',
    newState: 'COMMITTED',
    actorType: 'SYSTEM',
    reason: 'Stock permanently committed following payment confirmation',
  });

  return pendingReservations;
}

/**
 * Releases uncommitted reservations back to available stock
 */
export async function releaseReservation(orderId, reason = 'Order cancelled or expired') {
  const pendingReservations = await Reservation.find({
    order: orderId,
    status: 'PENDING',
  });

  if (!pendingReservations.length) return [];

  for (const res of pendingReservations) {
    await Listing.updateOne(
      { _id: res.listing },
      {
        $inc: {
          reservedStock: -res.quantity,
          availableStock: res.quantity,
        },
      }
    );

    res.status = 'RELEASED';
    res.releasedAt = new Date();
    res.releaseReason = reason;
    await res.save();
  }

  await StatusHistory.create({
    entityType: 'RESERVATION',
    entityId: orderId,
    field: 'reservationStatus',
    previousState: 'PENDING',
    newState: 'RELEASED',
    actorType: 'SYSTEM',
    reason,
  });

  return pendingReservations;
}

/**
 * Periodic background cleanup of expired pending reservations
 */
export async function cleanupExpiredReservations() {
  const now = new Date();
  const expiredReservations = await Reservation.find({
    status: 'PENDING',
    expiresAt: { $lt: now },
  });

  const releasedOrders = new Set();

  for (const res of expiredReservations) {
    await Listing.updateOne(
      { _id: res.listing },
      {
        $inc: {
          reservedStock: -res.quantity,
          availableStock: res.quantity,
        },
      }
    );

    res.status = 'RELEASED';
    res.releasedAt = now;
    res.releaseReason = 'Reservation expired after 15 minutes window';
    await res.save();

    releasedOrders.add(res.order.toString());
  }

  return {
    releasedCount: expiredReservations.length,
    ordersAffected: Array.from(releasedOrders),
  };
}

export default {
  reserveStockForOrder,
  commitReservation,
  releaseReservation,
  cleanupExpiredReservations,
};

import User from '../users/userModel.js';
import Listing from '../listings/listingModel.js';
import Swap from '../swaps/swapModel.js';
import Order from '../orders/orderModel.js';
import Report from './reportModel.js';
import { updateTracking } from '../orders/checkoutService.js';

/**
 * Returns administrative metrics across platform entities.
 */
export async function handleGetMetrics(req, res, next) {
  try {
    const [totalUsers, totalListings, activeListings, totalSwaps, completedSwaps, totalOrders, pendingReports] =
      await Promise.all([
        User.countDocuments(),
        Listing.countDocuments(),
        Listing.countDocuments({ status: 'active' }),
        Swap.countDocuments(),
        Swap.countDocuments({ status: 'COMPLETED' }),
        Order.countDocuments(),
        Report.countDocuments({ status: 'PENDING' }),
      ]);

    return res.status(200).json({
      status: 'success',
      data: {
        metrics: {
          totalUsers,
          totalListings,
          activeListings,
          totalSwaps,
          completedSwaps,
          totalOrders,
          pendingReports,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lists user accounts for administrative moderation.
 */
export async function handleGetUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.campus) query.campus = req.query.campus;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Moderates a user account status (activate/suspend).
 */
export async function handleUpdateUserStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        status: 'fail',
        message: 'isActive boolean is required',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    user.isActive = isActive;
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: `User account has been ${isActive ? 'activated' : 'suspended'}`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lists all listings across all states for admin inspection.
 */
export async function handleGetAdminListings(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('seller', '_id name email campus'),
      Listing.countDocuments(query),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        listings,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Moderates listing status (e.g. archiving inappropriate items).
 */
export async function handleUpdateListingStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['active', 'reserved', 'sold', 'archived'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid listing status',
      });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        status: 'fail',
        message: 'Listing not found',
      });
    }

    listing.status = status;
    await listing.save();

    return res.status(200).json({
      status: 'success',
      message: `Listing status updated to ${status}`,
      data: { listing },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Creates a moderation report against a listing or user.
 * (Can be called by any authenticated student)
 */
export async function handleCreateReport(req, res, next) {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({
        status: 'fail',
        message: 'targetType, targetId, and reason are required',
      });
    }

    const validReasons = [
      'PROHIBITED_ITEM',
      'INAPPROPRIATE_CONTENT',
      'COUNTERFEIT_OR_SCAM',
      'HARASSMENT_OR_SAFETY',
      'MISREPRESENTATION',
      'OTHER',
    ];

    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid report reason',
      });
    }

    // Check target exists
    if (targetType === 'LISTING') {
      const listing = await Listing.findById(targetId);
      if (!listing) {
        return res.status(404).json({
          status: 'fail',
          message: 'Target listing not found',
        });
      }
    } else if (targetType === 'USER') {
      const targetUser = await User.findById(targetId);
      if (!targetUser) {
        return res.status(404).json({
          status: 'fail',
          message: 'Target user not found',
        });
      }
    }

    // Check duplicate report
    const existing = await Report.findOne({
      reporter: req.user._id,
      targetType,
      targetId,
    });

    if (existing) {
      return res.status(400).json({
        status: 'fail',
        message: 'You have already submitted a report for this item or user.',
      });
    }

    const report = new Report({
      reporter: req.user._id,
      targetType,
      targetId,
      reason,
      description: description ? description.trim() : '',
    });

    await report.save();

    return res.status(201).json({
      status: 'success',
      message: 'Report submitted successfully. Campus administrators will investigate.',
      data: { report },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves reports queue for admin review.
 */
export async function handleGetReports(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.targetType) query.targetType = req.query.targetType;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reporter', '_id name campus email')
        .populate('resolvedBy', '_id name email'),
      Report.countDocuments(query),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        reports,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resolves or dismisses a moderation report.
 */
export async function handleResolveReport(req, res, next) {
  try {
    const { status, resolutionNotes, action } = req.body;

    if (!['RESOLVED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Status must be RESOLVED or DISMISSED',
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        status: 'fail',
        message: 'Report not found',
      });
    }

    report.status = status;
    report.resolutionNotes = resolutionNotes || '';
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();

    // Perform accompanying action if requested
    if (action === 'SUSPEND_LISTING' && report.targetType === 'LISTING') {
      await Listing.findByIdAndUpdate(report.targetId, { status: 'archived' });
    } else if (action === 'DEACTIVATE_USER') {
      const userIdToSuspend = report.targetType === 'USER'
        ? report.targetId
        : (await Listing.findById(report.targetId))?.seller;
      if (userIdToSuspend) {
        await User.findByIdAndUpdate(userIdToSuspend, { isActive: false });
      }
    }

    await report.save();

    return res.status(200).json({
      status: 'success',
      message: `Report has been ${status.toLowerCase()}`,
      data: { report },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lists all marketplace orders for admin overview and fulfillment management
 */
export async function handleGetAdminOrders(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.orderStatus) query.orderStatus = req.query.orderStatus;
    if (req.query.paymentStatus) query.paymentStatus = req.query.paymentStatus;
    if (req.query.fulfillmentStatus) query.fulfillmentStatus = req.query.fulfillmentStatus;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('buyer', '_id name campus email')
        .populate('seller', '_id name campus email'),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        orders,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates order tracking and fulfillment status by admin
 */
export async function handleUpdateAdminOrderFulfillment(req, res, next) {
  try {
    const { awbNumber, courierName, fulfillmentStatus } = req.body;
    const order = await updateTracking({
      orderId: req.params.id,
      awbNumber,
      courierName,
      fulfillmentStatus,
      adminId: req.user._id,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Order fulfillment status updated',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

import * as listingService from './listingService.js';

export async function handleCreateListing(req, res, next) {
  try {
    const listing = await listingService.createListing(req.user._id, req.body);
    return res.status(201).json({
      status: 'success',
      message: 'Listing created successfully',
      data: { listing },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetListings(req, res, next) {
  try {
    const result = await listingService.getListings(req.query);
    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetMyListings(req, res, next) {
  try {
    const listings = await listingService.getMyListings(req.user._id);
    return res.status(200).json({
      status: 'success',
      data: { listings },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetListingById(req, res, next) {
  try {
    const listing = await listingService.getListingById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        status: 'fail',
        message: 'Listing not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { listing },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateListing(req, res, next) {
  try {
    const listing = await listingService.updateListing(req.params.id, req.user, req.body);
    return res.status(200).json({
      status: 'success',
      message: 'Listing updated successfully',
      data: { listing },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteListing(req, res, next) {
  try {
    const listing = await listingService.deleteListing(req.params.id, req.user);
    return res.status(200).json({
      status: 'success',
      message: 'Listing successfully archived',
      data: { listing },
    });
  } catch (error) {
    next(error);
  }
}

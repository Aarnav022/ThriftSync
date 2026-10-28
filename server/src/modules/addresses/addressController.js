import addressService from './addressService.js';

export async function handleGetAddresses(req, res, next) {
  try {
    const addresses = await addressService.getUserAddresses(req.user._id);
    res.status(200).json({ status: 'success', data: { addresses } });
  } catch (error) {
    next(error);
  }
}

export async function handleCreateAddress(req, res, next) {
  try {
    const address = await addressService.createAddress(req.user._id, req.body);
    res.status(201).json({ status: 'success', message: 'Delivery address saved', data: { address } });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateAddress(req, res, next) {
  try {
    const address = await addressService.updateAddress(req.user._id, req.params.id, req.body);
    res.status(200).json({ status: 'success', message: 'Address updated', data: { address } });
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteAddress(req, res, next) {
  try {
    await addressService.deleteAddress(req.user._id, req.params.id);
    res.status(200).json({ status: 'success', message: 'Address deleted' });
  } catch (error) {
    next(error);
  }
}

export default {
  handleGetAddresses,
  handleCreateAddress,
  handleUpdateAddress,
  handleDeleteAddress,
};

import Address from './addressModel.js';

export async function getUserAddresses(userId) {
  return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
}

export async function getAddressById(userId, addressId) {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new Error('ADDRESS_NOT_FOUND: Address not found or access denied.');
  }
  return address;
}

export async function createAddress(userId, addressData) {
  const count = await Address.countDocuments({ user: userId });
  const isFirst = count === 0;

  if (addressData.isDefault || isFirst) {
    await Address.updateMany({ user: userId }, { isDefault: false });
  }

  const address = await Address.create({
    ...addressData,
    user: userId,
    isDefault: Boolean(addressData.isDefault || isFirst),
  });

  return address;
}

export async function updateAddress(userId, addressId, updateData) {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new Error('ADDRESS_NOT_FOUND: Address not found or access denied.');
  }

  if (updateData.isDefault) {
    await Address.updateMany({ user: userId, _id: { $ne: addressId } }, { isDefault: false });
  }

  Object.assign(address, updateData);
  await address.save();
  return address;
}

export async function deleteAddress(userId, addressId) {
  const address = await Address.findOneAndDelete({ _id: addressId, user: userId });
  if (!address) {
    throw new Error('ADDRESS_NOT_FOUND: Address not found or access denied.');
  }
  return { success: true };
}

export default {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
};

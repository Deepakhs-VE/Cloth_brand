import { User } from '../models/User.js';
import { Address } from '../models/Address.js';
import { normalizePhoneNumber } from '../utils/phone.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = normalizePhoneNumber(phone);
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Address Management
export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: addresses.length, addresses });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const { fullName, phone, streetAddress, apartment, city, state, postalCode, country, isDefault, addressType } = req.body;

    const count = await Address.countDocuments({ user: req.user._id });
    const shouldBeDefault = isDefault || count === 0;

    if (shouldBeDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user._id,
      fullName,
      phone: normalizePhoneNumber(phone, { required: true, fieldName: 'Contact phone' }),
      streetAddress,
      apartment: apartment || '',
      city,
      state,
      postalCode,
      country: country || 'United States',
      isDefault: shouldBeDefault,
      addressType: addressType || 'home',
    });

    res.status(201).json({ success: true, message: 'Address added successfully', address });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const updates = { ...req.body };
    if (updates.phone !== undefined) {
      updates.phone = normalizePhoneNumber(updates.phone, {
        required: true,
        fieldName: 'Contact phone',
      });
    }
    Object.assign(address, updates);
    await address.save();

    res.status(200).json({ success: true, message: 'Address updated successfully', address });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // If deleted address was default, make the next one default
    if (address.isDefault) {
      const remaining = await Address.findOne({ user: req.user._id });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    res.status(200).json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const setDefaultAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    await Address.updateMany({ user: req.user._id }, { isDefault: false });
    address.isDefault = true;
    await address.save();

    res.status(200).json({ success: true, message: 'Default address updated', address });
  } catch (error) {
    next(error);
  }
};

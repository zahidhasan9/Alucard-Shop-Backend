import Address from '../models/AddressModel.js';
import User from '../models/UserModel.js';

//  Create a new address and link to user
const createAddress = async (req, res) => {
  try {
    const { street, city, division, postalCode } = req.body;
    if (!street || !city || !division || !postalCode) {
      return res.status(400).json({ message: 'All address fields are required' });
    }
    const newAddress = new Address({ ...req.body, user: req.userId });
    const savedAddress = await newAddress.save();

    //  Add address reference to user
    await User.findByIdAndUpdate(req.userId, { $push: { addresses: savedAddress._id } });

    res.status(201).json({ message: 'Address added successfully', address: savedAddress });
  } catch (err) {
    console.error('Create Address Error:', err.message);
    res.status(500).json({ message: 'Failed to create address', error: err.message });
  }
};

//  Get all addresses of a user (with population)
const getAllAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('addresses');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user.addresses);
  } catch (err) {
    console.error('Get Addresses Error:', err.message);
    res.status(500).json({ message: 'Failed to fetch addresses', error: err.message });
  }
};

//  Get address by type (e.g. billing, shipping)
const getAddressByType = async (req, res) => {
  try {
    const { type } = req.params;

    //  Validate type
    if (!['billing', 'shipping'].includes(type)) {
      return res.status(400).json({ message: 'Invalid address type' });
    }

    const addresses = await Address.find({ user: req.userId, type });

    res.status(200).json(addresses);
  } catch (err) {
    console.error('Get Address by Type Error:', err.message);
    res.status(500).json({ message: 'Failed to get address', error: err.message });
  }
};

//  Update an address
// const updateAddress = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const updated = await Address.findOneAndUpdate({ _id: id, user: req.userId }, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     if (!updated) {
//       return res.status(404).json({ message: 'Address not found or not authorized' });
//     }

//     res.status(200).json({ message: 'Address updated successfully', address: updated });
//   } catch (err) {
//     console.error('Update Address Error:', err.message);
//     res.status(500).json({ message: 'Update failed', error: err.message });
//   }
// };

const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDefault } = req.body;

    // If default address করা হয়, তাহলে অন্যগুলো false করে দিন
    if (isDefault === true) {
      await Address.updateMany(
        { user: req.userId, _id: { $ne: id } }, // auto casting works
        { $set: { isDefault: false } }
      );
    }

    const updated = await Address.findOneAndUpdate({ _id: id, user: req.userId }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Address not found or not authorized' });
    }

    res.status(200).json({ message: 'Address updated successfully', address: updated });
  } catch (err) {
    console.error('Update Address Error:', err.message);
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};

//  Delete an address
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Address.findOneAndDelete({ _id: id, user: req.userId });

    if (!deleted) {
      return res.status(404).json({ message: 'Address not found or not authorized' });
    }

    //  Remove from user document as well
    await User.findByIdAndUpdate(req.userId, { $pull: { addresses: id } });

    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (err) {
    console.error('Delete Address Error:', err.message);
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
};

export { createAddress, getAllAddresses, getAddressByType, updateAddress, deleteAddress };

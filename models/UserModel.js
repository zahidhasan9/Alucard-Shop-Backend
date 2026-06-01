import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // Minimum password length
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user', // Default role is 'user'
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
  type: Date,
  default: null,
},
  addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Address' }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  address: {
  type: String,
  trim: true,
  default: '',
},
country: {
  type: String,
  trim: true,
  default: '',
},
dateOfBirth: {
  type: Date,
  default: null,
},
gender: {
  type: String,
  trim: true,
  default: '',
},
skills: {
  type: String,
  trim: true,
  default: '',
},
profession: {
  type: String,
  trim: true,
  default: '',
},
companyName: {
  type: String,
  trim: true,
  default: '',
},
companyWebsite: {
  type: String,
  trim: true,
  default: '',
},
bio: {
  type: String,
  trim: true,
  default: '',
},
socials: {
  facebook: { type: String, trim: true, default: '' },
  x: { type: String, trim: true, default: '' },
  linkedin: { type: String, trim: true, default: '' },
  youtube: { type: String, trim: true, default: '' },
},
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the User model
const User = mongoose.model('User', userSchema);
export default User;

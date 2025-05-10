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
  addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Address" }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});



// Create the User model
const User = mongoose.model('User', userSchema);
export default User;

import mongoose from 'mongoose';

const addressSchema =mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["billing", "shipping"], default: "shipping" },
    fullName: String,
    division: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    phone:{
      type:String,
      required:true,
    },
    postalCode: {
      type: String,
      
    },
    street: {
      type: String,
      
    },
    isDefault: { type: Boolean, default: false },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });
  
// Create the User model
const User = mongoose.model('Address',addressSchema);
export default User;

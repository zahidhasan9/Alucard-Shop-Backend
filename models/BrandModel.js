import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

// Create the Review model
const BrandSchema = mongoose.model('Brand', brandSchema);
export default BrandSchema;

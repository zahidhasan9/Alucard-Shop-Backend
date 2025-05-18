import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// Create the Review model
const CategorySchema = mongoose.model('Category', categorySchema);
export default CategorySchema;

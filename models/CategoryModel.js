// import mongoose from 'mongoose';

// const categorySchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, unique: true },
//     slug: { type: String, required: true, unique: true },
//     description: { type: String },
//   },
//   { timestamps: true }
// );

// // Create the Review model
// const CategorySchema = mongoose.model('Category', categorySchema);
// export default CategorySchema;



import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    image: {
      type: String,
      trim: true,
      default: '',
    },

    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    metaTitle: {
      type: String,
      trim: true,
      default: '',
    },

    metaDescription: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

categorySchema.index({ name: 'text', description: 'text', slug: 'text' });

const Category = mongoose.model('Category', categorySchema);

export default Category;
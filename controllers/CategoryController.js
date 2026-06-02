// import Category from '../models/CategoryModel.js';
// import slugify from 'slugify';

// // Create Category
// export const createCategory = async (req, res) => {
//   try {
//     const { name } = req.body;

//     const existing = await Category.findOne({ name });
//     if (existing) {
//       return res.status(400).json({ message: 'Category already exists' });
//     }
//     const slug = slugify(name, { lower: true, strict: true });
//     const category = new Category({ name, slug });
//     await category.save();

//     res.status(201).json({ success: true, data: category });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Get All Categories
// export const getAllCategories = async (req, res) => {
//   try {
//     const categories = await Category.find().sort({ createdAt: -1 });
//     res.status(200).json({ success: true, data: categories });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Get Single Category by Slug
// export const getCategory = async (req, res) => {
//   try {
//     const { slug } = req.params;
//     const category = await Category.findOne({ slug });

//     if (!category) {
//       return res.status(404).json({ message: 'Category not found' });
//     }

//     res.status(200).json({ success: true, data: category });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Update Category
// export const updateCategory = async (req, res) => {
//   try {
//     const { slug } = req.params;
//     const { name } = req.body;

//     const newSlug = generateSlug(name);

//     const updated = await Category.findOneAndUpdate(
//       { slug },
//       { name, slug: newSlug },
//       { new: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ message: 'Category not found' });
//     }

//     res.status(200).json({ success: true, data: updated });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Delete Category
// export const deleteCategory = async (req, res) => {
//   try {
//     const { slug } = req.params;

//     const deleted = await Category.findOneAndDelete({ slug });

//     if (!deleted) {
//       return res.status(404).json({ message: 'Category not found' });
//     }

//     res.status(200).json({ success: true, message: 'Category deleted' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };










import mongoose from 'mongoose';
import slugify from 'slugify';
import Category from '../models/CategoryModel.js';
import Product from '../models/ProductModel.js';

const makeSlug = (text) => {
  return slugify(String(text || ''), {
    lower: true,
    strict: true,
    trim: true,
  });
};

const makeUniqueSlug = async (Model, name, ignoreId = null) => {
  const baseSlug = makeSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };

    if (ignoreId) {
      query._id = { $ne: ignoreId };
    }

    const exists = await Model.findOne(query).select('_id');

    if (!exists) return slug;

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

// const buildCategoryPayload = (body) => {
//   return {
//     name: body.name?.trim(),
//     description: body.description?.trim() || '',
//     image: body.image?.trim() || '',
//     parentCategory: body.parentCategory || null,
//     isActive:
//       typeof body.isActive === 'boolean' ? body.isActive : body.isActive === 'true',
//     isFeatured:
//       typeof body.isFeatured === 'boolean'
//         ? body.isFeatured
//         : body.isFeatured === 'true',
//     sortOrder: Number(body.sortOrder || 0),
//     metaTitle: body.metaTitle?.trim() || '',
//     metaDescription: body.metaDescription?.trim() || '',
//   };
// };



const buildCategoryPayload = (body) => {
  return {
    name: body.name?.trim(),
    description: body.description?.trim() || '',
    image: body.image?.trim() || '',

    iconKey: body.iconKey?.trim()?.toLowerCase() || 'shopping-bag',

    parentCategory: body.parentCategory || null,

    isActive:
      typeof body.isActive === 'boolean'
        ? body.isActive
        : body.isActive === 'true',

    isFeatured:
      typeof body.isFeatured === 'boolean'
        ? body.isFeatured
        : body.isFeatured === 'true',

    sortOrder: Number(body.sortOrder || 0),

    metaTitle: body.metaTitle?.trim() || '',
    metaDescription: body.metaDescription?.trim() || '',
  };
};



const attachProductCount = async (categories) => {
  const counts = await Product.aggregate([
    {
      $match: {
        category: {
          $in: categories.map((item) => item._id),
        },
      },
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = counts.reduce((acc, item) => {
    acc[item._id.toString()] = item.count;
    return acc;
  }, {});

  return categories.map((category) => ({
    ...category,
    productCount: countMap[category._id.toString()] || 0,
  }));
};

export const createCategory = async (req, res) => {
  try {
    const payload = buildCategoryPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({
        message: 'Category name is required',
      });
    }

    const existing = await Category.findOne({
      name: { $regex: `^${payload.name}$`, $options: 'i' },
    });

    if (existing) {
      return res.status(400).json({
        message: 'Category already exists',
      });
    }

    const slug = await makeUniqueSlug(Category, payload.name);

    const category = await Category.create({
      ...payload,
      slug,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to create category',
    });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parentCategory', 'name slug')
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    const data = await attachProductCount(categories);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to fetch categories',
    });
  }
};

export const getAdminCategories = async (req, res) => {
  try {
    const search = req.query.search?.trim() || '';
    const status = req.query.status || 'all';
    const featured = req.query.featured || 'all';

    const match = {};

    if (search) {
      match.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'active') match.isActive = true;
    if (status === 'inactive') match.isActive = false;

    if (featured === 'yes') match.isFeatured = true;
    if (featured === 'no') match.isFeatured = false;

    const categories = await Category.find(match)
      .populate('parentCategory', 'name slug')
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    const data = await attachProductCount(categories);

    const stats = {
      total: await Category.countDocuments({}),
      active: await Category.countDocuments({ isActive: true }),
      inactive: await Category.countDocuments({ isActive: false }),
      featured: await Category.countDocuments({ isFeatured: true }),
    };

    res.status(200).json({
      success: true,
      data,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to fetch admin categories',
    });
  }
};

export const getCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug })
      .populate('parentCategory', 'name slug')
      .lean();

    if (!category) {
      return res.status(404).json({
        message: 'Category not found',
      });
    }

    const productCount = await Product.countDocuments({
      category: category._id,
    });

    res.status(200).json({
      success: true,
      data: {
        ...category,
        productCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to fetch category',
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug });

    if (!category) {
      return res.status(404).json({
        message: 'Category not found',
      });
    }

    const payload = buildCategoryPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({
        message: 'Category name is required',
      });
    }

    const sameName = await Category.findOne({
      _id: { $ne: category._id },
      name: { $regex: `^${payload.name}$`, $options: 'i' },
    });

    if (sameName) {
      return res.status(400).json({
        message: 'Another category with this name already exists',
      });
    }

    const newSlug =
      payload.name !== category.name
        ? await makeUniqueSlug(Category, payload.name, category._id)
        : category.slug;

    category.name = payload.name;
    category.slug = newSlug;
    category.description = payload.description;
    category.image = payload.image;
    category.iconKey = payload.iconKey;
    category.parentCategory =
      payload.parentCategory && mongoose.Types.ObjectId.isValid(payload.parentCategory)
        ? payload.parentCategory
        : null;
    category.isActive = payload.isActive;
    category.isFeatured = payload.isFeatured;
    category.sortOrder = payload.sortOrder;
    category.metaTitle = payload.metaTitle;
    category.metaDescription = payload.metaDescription;

    const updated = await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to update category',
    });
  }
};

export const toggleCategoryStatus = async (req, res) => {
  try {
    const { slug } = req.params;
    const { isActive, isFeatured } = req.body;

    const category = await Category.findOne({ slug });

    if (!category) {
      return res.status(404).json({
        message: 'Category not found',
      });
    }

    if (typeof isActive === 'boolean') category.isActive = isActive;
    if (typeof isFeatured === 'boolean') category.isFeatured = isFeatured;

    const updated = await category.save();

    res.status(200).json({
      success: true,
      message: 'Category status updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to update category status',
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug });

    if (!category) {
      return res.status(404).json({
        message: 'Category not found',
      });
    }

    const productCount = await Product.countDocuments({
      category: category._id,
    });

    if (productCount > 0) {
      category.isActive = false;
      await category.save();

      return res.status(200).json({
        success: true,
        softDeleted: true,
        message:
          'Category has products, so it was deactivated instead of deleted',
        data: category,
      });
    }

    await Category.deleteOne({ _id: category._id });

    res.status(200).json({
      success: true,
      deleted: true,
      message: 'Category deleted successfully',
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to delete category',
    });
  }
};
import slugify from 'slugify';
import Brand from '../models/BrandModel.js';
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

const buildBrandPayload = (body) => {
  return {
    name: body.name?.trim(),
    description: body.description?.trim() || '',
    logo: body.logo?.trim() || '',
    website: body.website?.trim() || '',
    isActive:
      typeof body.isActive === 'boolean' ? body.isActive : body.isActive === 'true',
    isFeatured:
      typeof body.isFeatured === 'boolean'
        ? body.isFeatured
        : body.isFeatured === 'true',
    sortOrder: Number(body.sortOrder || 0),
    metaTitle: body.metaTitle?.trim() || '',
    metaDescription: body.metaDescription?.trim() || '',
  };
};

const attachProductCount = async (brands) => {
  const counts = await Product.aggregate([
    {
      $match: {
        brand: {
          $in: brands.map((item) => item._id),
        },
      },
    },
    {
      $group: {
        _id: '$brand',
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = counts.reduce((acc, item) => {
    acc[item._id.toString()] = item.count;
    return acc;
  }, {});

  return brands.map((brand) => ({
    ...brand,
    productCount: countMap[brand._id.toString()] || 0,
  }));
};

export const createBrand = async (req, res) => {
  try {
    const payload = buildBrandPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({
        message: 'Brand name is required',
      });
    }

    const existing = await Brand.findOne({
      name: { $regex: `^${payload.name}$`, $options: 'i' },
    });

    if (existing) {
      return res.status(400).json({
        message: 'Brand already exists',
      });
    }

    const slug = await makeUniqueSlug(Brand, payload.name);

    const brand = await Brand.create({
      ...payload,
      slug,
    });

    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to create brand',
    });
  }
};

export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    const data = await attachProductCount(brands);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to fetch brands',
    });
  }
};

export const getAdminBrands = async (req, res) => {
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

    const brands = await Brand.find(match)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    const data = await attachProductCount(brands);

    const stats = {
      total: await Brand.countDocuments({}),
      active: await Brand.countDocuments({ isActive: true }),
      inactive: await Brand.countDocuments({ isActive: false }),
      featured: await Brand.countDocuments({ isFeatured: true }),
    };

    res.status(200).json({
      success: true,
      data,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to fetch admin brands',
    });
  }
};

export const getBrand = async (req, res) => {
  try {
    const { slug } = req.params;

    const brand = await Brand.findOne({ slug }).lean();

    if (!brand) {
      return res.status(404).json({
        message: 'Brand not found',
      });
    }

    const productCount = await Product.countDocuments({
      brand: brand._id,
    });

    res.status(200).json({
      success: true,
      data: {
        ...brand,
        productCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to fetch brand',
    });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const { slug } = req.params;
    const brand = await Brand.findOne({ slug });

    if (!brand) {
      return res.status(404).json({
        message: 'Brand not found',
      });
    }

    const payload = buildBrandPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({
        message: 'Brand name is required',
      });
    }

    const sameName = await Brand.findOne({
      _id: { $ne: brand._id },
      name: { $regex: `^${payload.name}$`, $options: 'i' },
    });

    if (sameName) {
      return res.status(400).json({
        message: 'Another brand with this name already exists',
      });
    }

    const newSlug =
      payload.name !== brand.name
        ? await makeUniqueSlug(Brand, payload.name, brand._id)
        : brand.slug;

    brand.name = payload.name;
    brand.slug = newSlug;
    brand.description = payload.description;
    brand.logo = payload.logo;
    brand.website = payload.website;
    brand.isActive = payload.isActive;
    brand.isFeatured = payload.isFeatured;
    brand.sortOrder = payload.sortOrder;
    brand.metaTitle = payload.metaTitle;
    brand.metaDescription = payload.metaDescription;

    const updated = await brand.save();

    res.status(200).json({
      success: true,
      message: 'Brand updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to update brand',
    });
  }
};

export const toggleBrandStatus = async (req, res) => {
  try {
    const { slug } = req.params;
    const { isActive, isFeatured } = req.body;

    const brand = await Brand.findOne({ slug });

    if (!brand) {
      return res.status(404).json({
        message: 'Brand not found',
      });
    }

    if (typeof isActive === 'boolean') brand.isActive = isActive;
    if (typeof isFeatured === 'boolean') brand.isFeatured = isFeatured;

    const updated = await brand.save();

    res.status(200).json({
      success: true,
      message: 'Brand status updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to update brand status',
    });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const { slug } = req.params;

    const brand = await Brand.findOne({ slug });

    if (!brand) {
      return res.status(404).json({
        message: 'Brand not found',
      });
    }

    const productCount = await Product.countDocuments({
      brand: brand._id,
    });

    if (productCount > 0) {
      brand.isActive = false;
      await brand.save();

      return res.status(200).json({
        success: true,
        softDeleted: true,
        message: 'Brand has products, so it was deactivated instead of deleted',
        data: brand,
      });
    }

    await Brand.deleteOne({ _id: brand._id });

    res.status(200).json({
      success: true,
      deleted: true,
      message: 'Brand deleted successfully',
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to delete brand',
    });
  }
};
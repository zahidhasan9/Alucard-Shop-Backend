import Brand from '../models/BrandModel.js';
import slugify from 'slugify';

// Create Brand
export const createBrand = async (req, res) => {
  try {
    const { name } = req.body;

    const existing = await Brand.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Brand already exists' });
    }
    const slug = slugify(name, { lower: true, strict: true });
    const brand = new Brand({ name, slug });
    await brand.save();

    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Categories
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: brands });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Brand by Slug
export const getBrand = async (req, res) => {
  try {
    const { slug } = req.params;
    const brand = await Brand.findOne({ slug });

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Brand
export const updateBrand = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name } = req.body;

    const newSlug = generateSlug(name);

    const updated = await Brand.findOneAndUpdate({ slug }, { name, slug: newSlug }, { new: true });

    if (!updated) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Brand
export const deleteBrand = async (req, res) => {
  try {
    const { slug } = req.params;

    const deleted = await Brand.findOneAndDelete({ slug });

    if (!deleted) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    res.status(200).json({ success: true, message: 'Brand deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import Banner from '../models/BannerModel.js';
import { deleteImage } from '../utils/imageHandler.js';

const getUploadedImage = (req) => {
  if (!req.file) return '';

  if (process.env.UPLOAD_METHOD === 'cloudinary') {
    return req.file.path;
  }

  return `/uploads/${req.file.filename}`;
};

const toBoolean = (value, defaultValue = true) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return defaultValue;
};

const toDateOrNull = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildBannerPayload = (body, uploadedImage = '') => {
  const linkType = body.linkType || 'products';

  let link = body.link?.trim() || '/products';

  if (linkType === 'products' && !body.link?.trim()) {
    link = '/products';
  }

  return {
    title: body.title?.trim(),
    subtitle: body.subtitle?.trim() || '',
    label: body.label?.trim() || 'Featured',
    buttonText: body.buttonText?.trim() || 'Shop Now',
    image: uploadedImage || body.image?.trim() || '',
    linkType,
    link,
    isActive: toBoolean(body.isActive, true),
    sortOrder: Number(body.sortOrder || 0),
    startsAt: toDateOrNull(body.startsAt),
    endsAt: toDateOrNull(body.endsAt),
  };
};

const isBannerCurrentlyValid = {
  $and: [
    {
      $or: [{ startsAt: null }, { startsAt: { $lte: new Date() } }],
    },
    {
      $or: [{ endsAt: null }, { endsAt: { $gte: new Date() } }],
    },
  ],
};

export const createBanner = async (req, res) => {
  try {
    const uploadedImage = getUploadedImage(req);
    const payload = buildBannerPayload(req.body, uploadedImage);

    if (!payload.title) {
      return res.status(400).json({ message: 'Banner title is required' });
    }

    if (!payload.image) {
      return res.status(400).json({ message: 'Banner image is required' });
    }

    const banner = await Banner.create(payload);

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create banner',
    });
  }
};

export const getActiveBanners = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 6);

    const banners = await Banner.find({
      isActive: true,
      ...isBannerCurrentlyValid,
    })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch banners',
    });
  }
};

export const getAdminBanners = async (req, res) => {
  try {
    const search = req.query.search?.trim() || '';
    const status = req.query.status || 'all';

    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { label: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const banners = await Banner.find(filter).sort({
      sortOrder: 1,
      createdAt: -1,
    });

    const stats = {
      total: await Banner.countDocuments({}),
      active: await Banner.countDocuments({ isActive: true }),
      inactive: await Banner.countDocuments({ isActive: false }),
    };

    res.status(200).json({
      success: true,
      data: banners,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch admin banners',
    });
  }
};

export const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch banner',
    });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    const uploadedImage = getUploadedImage(req);
    const payload = buildBannerPayload(req.body, uploadedImage);

    if (!payload.title) {
      return res.status(400).json({ message: 'Banner title is required' });
    }

    if (!payload.image) {
      return res.status(400).json({ message: 'Banner image is required' });
    }

    if (uploadedImage && banner.image) {
      await deleteImage(banner.image);
    }

    banner.title = payload.title;
    banner.subtitle = payload.subtitle;
    banner.label = payload.label;
    banner.buttonText = payload.buttonText;
    banner.image = payload.image;
    banner.linkType = payload.linkType;
    banner.link = payload.link;
    banner.isActive = payload.isActive;
    banner.sortOrder = payload.sortOrder;
    banner.startsAt = payload.startsAt;
    banner.endsAt = payload.endsAt;

    const updated = await banner.save();

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update banner',
    });
  }
};

export const toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    if (typeof req.body.isActive === 'boolean') {
      banner.isActive = req.body.isActive;
    } else {
      banner.isActive = !banner.isActive;
    }

    const updated = await banner.save();

    res.status(200).json({
      success: true,
      message: 'Banner status updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update banner status',
    });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    if (banner.image) {
      await deleteImage(banner.image);
    }

    await banner.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully',
      data: banner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete banner',
    });
  }
};
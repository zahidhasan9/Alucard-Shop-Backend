import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const extractPublicId = url => {
  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    const publicPath = url.substring(uploadIndex + 8);
    const pathWithoutVersion = publicPath.replace(/^v\d+\/|\/v\d+\//, '');
    return pathWithoutVersion.split('.')[0]; // remove .jpg/.png
  } catch (error) {
    console.error('Failed to extract public_id:', error);
    return null;
  }
};

export const deleteImage = async url => {
  try {
    if (process.env.UPLOAD_METHOD === 'cloudinary') {
      const publicId = extractPublicId(url);
      console.log('public id', publicId);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
        console.log('delete');
      }
    } else {
      const __dirname = path.resolve();
      const filePath = path.join(__dirname, url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error('Error deleting image:', error.message);
  }
};

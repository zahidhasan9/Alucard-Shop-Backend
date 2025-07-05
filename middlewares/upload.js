// const multer = require("multer");
// const path = require("path");
// const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, UPLOAD_METHOD } = process.env;

// let upload;

// if (UPLOAD_METHOD === "cloudinary") {
//   const { CloudinaryStorage } = require("multer-storage-cloudinary");
//   const cloudinary = require("cloudinary").v2;

//   cloudinary.config({
//     cloud_name: CLOUDINARY_CLOUD_NAME,
//     api_key: CLOUDINARY_API_KEY,
//     api_secret: CLOUDINARY_API_SECRET,
//   });

//   const storage = new CloudinaryStorage({
//     cloudinary,
//     params: {
//       folder: "ecommerce/products",
//       allowed_formats: ["jpg", "png", "jpeg", "webp"],
//     },
//   });

//   upload = multer({ storage });
// } else {
//   const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, "uploads/");
//     },
//     filename: (req, file, cb) => {
//       const uniqueName = `${Date.now()}-${file.originalname}`;
//       cb(null, uniqueName);
//     },
//   });

//   upload = multer({ storage });
// }

// module.exports = upload;

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, UPLOAD_METHOD } =
  process.env;

let upload;

if (UPLOAD_METHOD === 'cloudinary') {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'ecommerce/products',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
  });

  const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/webp' ||
      file.mimetype === 'image/avif'
    ) {
      // To accept the file pass `true`, like so:
      cb(null, true);
    } else {
      // To reject this file pass `false`, like so:
      cb('Images only!');
    }
  };

  upload = multer({ storage, fileFilter });
} else {
  // Ensure uploads folder exists
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/webp'
    ) {
      // To accept the file pass `true`, like so:
      cb(null, true);
    } else {
      // To reject this file pass `false`, like so:
      cb('Images only!');
    }
  };

  upload = multer({ storage, fileFilter });
}

export default upload; // If use upload it is only for single upload

// //  export multiple field handler for thumbnail and images
// export const uploadMultiple = upload.fields([
//   { name: 'thumbnail', maxCount: 1 },
//   { name: 'images', maxCount: 3 },
// ]);

// import express from 'express';
// import {
//   createBrand,
//   getAllBrands,
//   getBrand,
//   updateBrand,
//   deleteBrand,
// } from '../controllers/BrandController.js';

// const router = express.Router();

// router.post('/', createBrand);
// router.get('/', getAllBrands);
// router.get('/:slug', getBrand);
// router.put('/:slug', updateBrand);
// router.delete('/:slug', deleteBrand);

// export default router;





import express from 'express';
import {
  createBrand,
  getAllBrands,
  getBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/BrandController.js';

import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getAllBrands);
router.get('/:slug', getBrand);

router.post('/', protect, admin, createBrand);
router.put('/:slug', protect, admin, updateBrand);
router.delete('/:slug', protect, admin, deleteBrand);

export default router;
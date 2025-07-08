import express from 'express';
import {
  createBrand,
  getAllBrands,
  getBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/BrandController.js';

const router = express.Router();

router.post('/', createBrand);
router.get('/', getAllBrands);
router.get('/:slug', getBrand);
router.put('/:slug', updateBrand);
router.delete('/:slug', deleteBrand);

export default router;

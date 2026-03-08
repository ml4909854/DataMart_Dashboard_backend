const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { validateProductFilters, validateProductId } = require('../middleware/validation');

router.get('/', validateProductFilters, productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/categories/search', productController.searchCategories); // ✅ NEW
router.get('/brands', productController.getBrands);
router.get('/:id', validateProductId, productController.getProductById);

module.exports = router;
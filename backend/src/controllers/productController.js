const productService = require('../services/productService');

class ProductController {
    async getProducts(req, res, next) {
        try {
            const search = req.query.search ? decodeURIComponent(req.query.search) : undefined;
            
            const filters = {
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 20, 50),
                search: search,
                searchType: req.query.searchType || 'all',
                category: req.query.category,
                minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder
            };
            
            console.log('📥 Controller received filters:', filters);
            
            const result = await productService.getProducts(filters);
            
            res.json({
                success: true,
                data: result.products,
                pagination: result.pagination,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Controller error:', error);
            next(error);
        }
    }

    async getProductById(req, res, next) {
        try {
            const product = await productService.getProductById(req.params.id);
            res.json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    async getCategories(req, res, next) {
        try {
            const categories = await productService.getCategories();
            res.json({ success: true, data: categories });
        } catch (error) {
            next(error);
        }
    }

    // ✅ NEW: Search categories endpoint
    async searchCategories(req, res, next) {
        try {
            const { term } = req.query;
            if (!term) {
                return res.json({ success: true, data: [] });
            }
            
            const categories = await productService.searchCategories(term);
            res.json({ success: true, data: categories });
        } catch (error) {
            next(error);
        }
    }

    async getBrands(req, res, next) {
        try {
            const brands = await productService.getAllBrands();
            res.json({ success: true, data: brands });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProductController();
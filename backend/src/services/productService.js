const productRepository = require('../repositories/productRepository');

class ProductService {
    async getProducts(filters) {
        try {
            const result = await productRepository.findAll(filters);
            return {
                products: result.data,
                pagination: result.pagination
            };
        } catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }

    async getProductById(id) {
        try {
            const product = await productRepository.findById(id);
            if (!product) throw new Error('Product not found');
            return product;
        } catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }

    async getCategories() {
        try {
            return await productRepository.getCategories();
        } catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }

    // ✅ NEW: Search categories
    async searchCategories(term) {
        try {
            return await productRepository.searchCategories(term);
        } catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }

    async getAllBrands() {
        try {
            return await productRepository.getAllBrands();
        } catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
}

module.exports = new ProductService();
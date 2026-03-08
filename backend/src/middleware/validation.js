const validateProductFilters = (req, res, next) => {
    const { page, limit } = req.query;
    
    // Page validation
    if (page && (isNaN(page) || page < 1)) {
        return res.status(400).json({
            success: false,
            error: 'Page must be a positive number'
        });
    }
    
    // Limit validation
    if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
        return res.status(400).json({
            success: false,
            error: 'Limit must be between 1 and 100'
        });
    }
    
    next();
};

const validateProductId = (req, res, next) => {
    const { id } = req.params;
    
    // UUID format check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(id)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid product ID format'
        });
    }
    
    next();
};

module.exports = {
    validateProductFilters,
    validateProductId
};
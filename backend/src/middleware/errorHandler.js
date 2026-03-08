const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.message);
    console.error(err.stack);

    let status = 500;
    let message = 'Internal server error';

    // Custom errors
    if (err.message === 'Product not found') {
        status = 404;
        message = 'Product not found';
    }

    if (err.message.includes('UUID')) {
        status = 400;
        message = 'Invalid product ID format';
    }

    // Supabase errors
    if (err.code === 'PGRST100') {
        status = 400;
        message = 'Invalid search query. Please try a different search term.';
    }

    res.status(status).json({
        success: false,
        error: {
            message,
            status,
            timestamp: new Date().toISOString()
        }
    });
};

module.exports = errorHandler;
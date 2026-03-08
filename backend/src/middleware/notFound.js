const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.method} ${req.url} not found`,
            status: 404,
            timestamp: new Date().toISOString()
        }
    });
};

module.exports = notFound;
const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
  };
  
  const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
  
    if (process.env.NODE_ENV !== "production") {
      console.error(`[ERROR] ${statusCode} - ${message}`);
      console.error(err.stack);
    }
  
    res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
  };
  
  module.exports = { notFound, globalErrorHandler };
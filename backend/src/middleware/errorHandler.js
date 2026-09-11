/**
 * Global Error Handler Middleware
 */

function errorHandler(err, req, res, next) {
  console.error(`💥 [Error] ${req.method} ${req.url}:`, err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error occurred.";

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: message,
      details: process.env.NODE_ENV === "development" ? err.stack : undefined
    }
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `The endpoint ${req.method} ${req.originalUrl} does not exist on this server. Visit /api/docs for available routes.`
    }
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};

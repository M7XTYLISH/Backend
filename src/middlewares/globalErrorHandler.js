import { config } from "../config/config.js";

const globalErrorHandler = (err, req, res, next) => {
  // Determine the status code to be sent in the response
  const statusCode = err.statusCode || 500;

  // Construct the response JSON object with error details
  const response = {
    message: err.message, // Error message
    // Include error stack trace only in development environment
    errorStack: config.env === "development" ? err.stack : "",
  };

  // Send the response with appropriate status code
  return res.status(statusCode).json(response);
};

export default globalErrorHandler;

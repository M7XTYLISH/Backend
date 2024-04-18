import createHttpError from "http-errors";
import { config } from "./config.js";
import pkg from "jsonwebtoken";

const { verify } = pkg;

// Middleware function for authentication
const authenticate = (req, res, next) => {
  // Extracting token from request header
  const token = req.header("Authorization");

  // If token is not provided, return an error
  if (!token) {
    const error = createHttpError(401, "Authorization token is required");
    return next(error);
  }

  try {
    // Parsing the token
    const parsedToken = token.split(" ")[1];
    // Verifying and decoding the token
    const tokenDecoded = verify(parsedToken, config.jwtSecret);

    req.userId = tokenDecoded.sub; // Assigning the user ID from the decoded token to the request object
  } catch (err) {
    // If token is expired or invalid, return an error
    const error = createHttpError(401, "Token Expired.");
    return next(error);
  }

  // If authentication is successful, proceed to the next middleware
  next();
};

export default authenticate;

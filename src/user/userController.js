import createHttpError from "http-errors";
import userModel from "./userModel.js";
import bcrypt from "bcrypt";
import { config } from "../config/config.js";
import pkg from "jsonwebtoken";

const { sign } = pkg;

// --------------------- Create User ------------------------
const createUser = async (req, res, next) => {
  // Extracting name, email, and password from the request body
  const { name, email, password } = req.body;

  // Checking if all required fields are provided
  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are required!");
    return next(error);
  }

  try {
    // Checking if a user with the same email already exists
    const user = await userModel.findOne({ email });

    if (user) {
      const error = createHttpError(
        400,
        "User already exists with this email."
      );
      return next(error);
    }
  } catch (err) {
    const error = createHttpError(400, "Error while getting user.");
    return next(error);
  }

  // Hashing the password
  const hashedPassword = await bcrypt.hash(password, 10);
  let newUser;

  try {
    // Creating a new user with the hashed password
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (err) {
    const error = createHttpError(500, "Error while creating user.");
    return next(error);
  }

  try {
    // Generating a JWT token for the newly created user
    const token = sign({ sub: newUser._id }, config.jwtSecret, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    // Sending the token as a response
    res.status(201).json({ accessToken: token });
  } catch (err) {
    const error = createHttpError(500, "Error while signing the jwt token.");
    return next(error);
  }
};

// --------------------- Login User ------------------------
const loginUser = async (req, res, next) => {
  // Extracting email and password from the request body
  const { email, password } = req.body;

  // Checking if both email and password are provided
  if (!email || !password) {
    const error = createHttpError(400, "All fields are required!");
    return next(error);
  }
  let user;

  try {
    // Finding the user by email
    user = await userModel.findOne({ email });

    // If user not found, return error
    if (!user) {
      const error = createHttpError(404, "User not found.");
      return next(error);
    }
  } catch (err) {
    const error = createHttpError(400, "Error while getting user.");
    return next(error);
  }

  // Comparing the provided password with the hashed password stored in the database
  const isMatch = await bcrypt.compare(password, user.password);

  // If password doesn't match, return error
  if (!isMatch) {
    const error = createHttpError(400, "Password is incorrect!");
    return next(error);
  }

  try {
    // Generating a JWT token for the authenticated user
    const token = sign({ sub: user._id }, config.jwtSecret, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    // Sending the token as a response
    res.json({ accessToken: token });
  } catch (err) {
    const error = createHttpError(500, "Error while signing the jwt token.");
    return next(error);
  }
};

export { createUser, loginUser };

import createHttpError from "http-errors";
import userModel from "./userModel.js";
import bcrypt from "bcrypt";
import { config } from "../config/config.js";
import pkg from "jsonwebtoken";

const { sign } = pkg;

const createUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are required!");
    return next(error);
  }

  try {
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

  const hashedPassword = await bcrypt.hash(password, 10);
  let newUser;

  try {
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
    const token = sign({ sub: newUser._id }, config.jwtSecret, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    res.status(201).json({ accessToken: token });
  } catch (err) {
    const error = createHttpError(500, "Error while signing the jwt token.");
    return next(error);
  }
};



export { createUser, loginUser };

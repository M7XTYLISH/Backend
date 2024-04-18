import path from "node:path";
import express from "express";
import { createBook, getSingleBook, listBooks, updateBook } from "./bookController.js";
import multer from "multer";
import { fileURLToPath } from "node:url";
import authenticate from "../config/authenticate.js";

// Create a new router instance
const bookRouter = express.Router();

// Get the filename and dirname using fileURLToPath and dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  // Set destination directory for file uploads
  dest: path.resolve(__dirname, "../../public/data/uploads"),
  // Set limits for file size
  limits: { fieldSize: 1e7 },
});

// Route to handle creating a new book
bookRouter.post(
  "/",
  // Middleware to authenticate the user
  authenticate,
  // Middleware to handle file uploads
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  // Controller function to create a new book
  createBook
);

// Route to handle updating an existing book
bookRouter.patch(
  "/:bookId",
  // Middleware to authenticate the user
  authenticate,
  // Middleware to handle file uploads
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  // Controller function to update an existing book
  updateBook
);

bookRouter.get("/", listBooks);
bookRouter.get("/:bookId", getSingleBook);

// Export the bookRouter
export default bookRouter;

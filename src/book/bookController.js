import path from "node:path";
import cloudinary from "../config/cloudinary.js";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import bookModel from "./bookModel.js";
import createHttpError from "http-errors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------- Create Book ------------------------
const createBook = async (req, res, next) => {
  try {
    // Extract title and genre from request body
    const { title, genre } = req.body;

    let coverImageUploadResult;
    let bookUploadResult;
    let coverImageFilePath;
    let bookFilePath;

    // Upload cover image to Cloudinary
    try {
      const coverImageMimeType = req.files.coverImage[0].mimetype
        .split("/")
        .pop();
      const coverImageFileName = req.files.coverImage[0].filename;
      coverImageFilePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        coverImageFileName
      );

      coverImageUploadResult = await cloudinary.uploader.upload(
        coverImageFilePath,
        {
          filename_override: coverImageFileName,
          folder: "book-covers",
          format: coverImageMimeType,
        }
      );
    } catch (err) {
      const error = createHttpError(500, "Error while uploading cover image.");
      return next(error);
    }

    // Upload book file to Cloudinary
    try {
      const bookFileName = req.files.file[0].filename;
      bookFilePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        bookFileName
      );

      bookUploadResult = await cloudinary.uploader.upload(bookFilePath, {
        resource_type: "raw",
        filename_override: bookFileName,
        folder: "book-pdfs",
        format: "pdf",
      });
    } catch (err) {
      const error = createHttpError(500, "Error while uploading book file.");
      return next(error);
    }

    // Create new book entry in the database
    const newBook = await bookModel.create({
      title,
      genre,
      author: req.userId,
      coverImage: coverImageUploadResult.secure_url,
      file: bookUploadResult.secure_url,
    });

    // Delete temporary files after upload
    try {
      await fs.promises.unlink(coverImageFilePath);
      await fs.promises.unlink(bookFilePath);
    } catch (err) {
      const error = createHttpError(
        500,
        "Error while deleting temporary files."
      );
      return next(error);
    }

    // Send response with the new book ID
    res.status(201).json({ _id: newBook._id });
  } catch (err) {
    // Handle any unexpected errors during book creation
    const error = createHttpError(500, "Error while creating a book.");
    return next(error);
  }
};

// --------------------- Update Book ------------------------
const updateBook = async (req, res, next) => {
  try {
    const { title, genre } = req.body;
    const bookId = req.params.bookId;

    // Find the book by ID
    const book = await bookModel.findOne({ _id: bookId });

    // If book not found, return 404 error
    if (!book) {
      const error = createHttpError(404, "Book not found.");
      return next(error);
    }

    // Check if the logged-in user is the author of the book
    if (book.author.toString() !== req.userId) {
      const error = createHttpError(
        403,
        "You cannot update another user's book."
      );
      return next(error);
    }

    let completeCoverImage = book.coverImage;
    let completeFileName = book.file;

    // Handle cover image upload if provided
    if (req.files.coverImage) {
      try {
        const coverImageFileName = req.files.coverImage[0].filename;
        const coverImageFilePath = path.resolve(
          __dirname,
          "../../public/data/uploads/",
          coverImageFileName
        );

        const coverImageMimeType = req.files.coverImage[0].mimetype
          .split("/")
          .pop();

        const coverImageUploadResult = await cloudinary.uploader.upload(
          coverImageFilePath,
          {
            filename_override: coverImageFileName,
            folder: "book-covers",
            format: coverImageMimeType,
          }
        );

        completeCoverImage = coverImageUploadResult.secure_url;

        await fs.promises.unlink(coverImageFilePath);
      } catch (err) {
        const error = createHttpError(
          500,
          "Error while uploading cover image."
        );
        return next(error);
      }
    }

    // Handle book file upload if provided
    if (req.files.file) {
      try {
        const bookFileName = req.files.file[0].filename;
        const bookFilePath = path.resolve(
          __dirname,
          "../../public/data/uploads/",
          bookFileName
        );

        const bookUploadResult = await cloudinary.uploader.upload(
          bookFilePath,
          {
            resource_type: "raw",
            filename_override: bookFileName,
            folder: "book-pdfs",
            format: "pdf",
          }
        );

        completeFileName = bookUploadResult.secure_url;

        await fs.promises.unlink(bookFilePath);
      } catch (err) {
        const error = createHttpError(500, "Error while uploading book file.");
        return next(error);
      }
    }

    const updatedBook = await bookModel.findOneAndUpdate(
      { _id: bookId },
      { title, genre, coverImage: completeCoverImage, file: completeFileName },
      { new: true }
    );

    res.json(updatedBook);
  } catch (err) {
    const error = createHttpError(500, "Error while updating the book.");
    return next(error);
  }
};

// --------------------- List Book ------------------------
const listBooks = async (req, res, next) => {
  try {
    const books = await bookModel.find();
    return res.json(books);
  } catch (err) {
    const error = createHttpError(500, "Error while retrieving books.");
    return next(error);
  }
};

// --------------------- Get Single Book ------------------------
const getSingleBook = async (req, res, next) => {
  const bookId = req.params.bookId;
  try {
    const book = await bookModel.findOne({ _id: bookId });

    if (!book) {
      const error = createHttpError(404, "Book not found.");
      return next(error);
    }

    return res.json(book);
  } catch (err) {
    const error = createHttpError(500, "Error while retrieving the book.");
    return next(error);
  }
};

// --------------------- Delete Book ------------------------
const deleteBook = async (req, res, next) => {
  const bookId = req.params.bookId;
  try {
    const book = await bookModel.findOne({ _id: bookId });

    if (!book) {
      const error = createHttpError(404, "Book not found.");
      return next(error);
    }

    if (book.author.toString() !== req.userId) {
      const error = createHttpError(
        403,
        "You cannot delete another user's book."
      );
      return next(error);
    }

    const coverFileSplits = book.coverImage.split("/");
    const coverImagePublicId =
      coverFileSplits.at(-2) + "/" + coverFileSplits.at(-1)?.split(".").at(-2);

    const bookFileSplits = book.file.split("/");
    const bookFilePublicId =
      bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);

    try {
      await cloudinary.uploader.destroy(coverImagePublicId);
      await cloudinary.uploader.destroy(bookFilePublicId, {
        resource_type: "raw",
      });
    } catch (err) {
      const error = createHttpError(500, "Error while deleting image and pdf.");
      return next(error);
    }

    await bookModel.deleteOne({ _id: bookId });

    res.sendStatus(204);
  } catch (err) {
    const error = createHttpError(500, "Error while deleting the book.");
    return next(error);
  }
};

export { createBook, updateBook, listBooks, getSingleBook, deleteBook };

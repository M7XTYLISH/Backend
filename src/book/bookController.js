import path from "node:path";
import cloudinary from "../config/cloudinary.js";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import bookModel from "./bookModel.js";
import createHttpError from "http-errors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createBook = async (req, res, next) => {
  try {
    const { title, genre } = req.body;

    let coverImageUploadResult;
    let bookUploadResult;
    let coverImageFilePath;
    let bookFilePath;

    try {
      const coverImageMimeType = req.files.coverImage[0].mimetype
        .split("/")
        .at(-1);
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
      const error = createHttpError(500, "Error while uploading image.");
      return next(error);
    }

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
      const error = createHttpError(500, "Error while uploading file.");
      return next(error);
    }

    const newBook = await bookModel.create({
      title,
      genre,
      author: req.userId,
      coverImage: coverImageUploadResult.secure_url,
      file: bookUploadResult.secure_url,
    });

    try {
      await fs.promises.unlink(coverImageFilePath);
      await fs.promises.unlink(bookFilePath);
    } catch (err) {
      const error = createHttpErrorError(
        500,
        "Error while deleting image or file."
      );
      return next(error);
    }

    res.status(201).json({ _id: newBook._id });
  } catch (err) {
    const error = createHttpError(500, "Error while creating a book.");
    return next(error);
  }
};

const updateBook = async (req, res, next) => {
  try {
    const { title, genre } = req.body;
    const bookId = req.params.bookId;

    const book = await bookModel.findOne({ _id: bookId });

    if (!book) {
      const error = createHttpError(404, "Book not found.");
      return next(error);
    }

    if (book.author.toString() !== req.userId) {
      const error = createHttpError(
        403,
        "You cannot update another user's book."
      );
      return next(error);
    }

    let completeCoverImage = book.coverImage;
    let completeFileName = book.file;

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

export { createBook, updateBook };

import path from "node:path";
import cloudinary from "../config/cloudinary.js";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import bookModel from "./bookModel.js";

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
        filename_override: coverImageFileName,
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
      author: "662037ebf56885f34afafa4b",
      coverImage: coverImageUploadResult.secure_url,
      file: bookUploadResult.secure_url,
    });

    try {
      await fs.promises.unlink(coverImageFilePath);
      await fs.promises.unlink(bookFilePath);
    } catch (err) {
      const error = createHttpError(500, "Error while deleting image or file.");
      return next(error);
    }

    res.status(201).json({ _id: newBook._id });
  } catch (err) {
    const error = createHttpError(500, "Error while creating book.");
    return next(error);
  }
};

export { createBook };

import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import cors from "cors";
import userRouter from "./user/userRouter.js";
import bookRouter from "./book/bookRouter.js";
import { config } from "./config/config.js";

const app = express();

// Enkable CORS for requests originating from "localhost:5513"
app.use(cors({ origin: config.frontendDomain }));

// Parse incoming requests with URL-encoded payloads
app.use(express.urlencoded({ extended: false }));

// Parse incoming requests with JSON payloads
app.use(express.json());

// Mount the userRouter middleware at the "/api/users" path
app.use("/api/users", userRouter);
app.use("/api/books", bookRouter);

// Global error handling middleware
app.use(globalErrorHandler);

export default app;
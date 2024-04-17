import express from "express";
import createHttpError from "http-errors";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import cors from "cors";
import userRouter from "./user/userRouter.js";

const app = express();

app.use(cors({ origin: "localhost:5513" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// app.get("/", (req, res, next) => {
//   // const error = createHttpError(400, "something went wrong");
//   // throw error;
//   // res.json("Welcome to elib project");
//   return next(createHttpError(400, "something went wrong"));
// });

app.use("/api/users", userRouter);



app.use(globalErrorHandler);

export default app;

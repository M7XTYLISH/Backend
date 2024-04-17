import mongoose from "mongoose";
import { config } from "./config.js";

const connectDB = async () => {
  try {
    // Event listener for successful database connection
    mongoose.connection.on("connected", () => {
      console.log("Connected to database Successfully.");
    });

    // Event listener for database connection error
    mongoose.connection.on("error", (err) => {
      console.log("Error in connecting database.", err);
    });

    // Attempt to connect to the database using the provided URL
    await mongoose.connect(config.databaseUrl);
  } catch (err) {
    // If there's an error during the connection attempt
    console.error("Failed to connect to database.", err);
    // Exit the process with a failure code
    process.exit(1);
  }
};

export default connectDB;

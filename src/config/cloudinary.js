import { v2 as cloudinary } from "cloudinary";
import { config } from "./config.js";

// Configure Cloudinary with the provided API credentials
cloudinary.config({
  cloud_name: config.cloudinaryCloud, // Cloud name from the configuration
  api_key: config.cloudinaryApiKey, // API key from the configuration
  api_secret: config.cloudinaryApiSecret, // API secret from the configuration
});

export default cloudinary;

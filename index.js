import app from "./src/app.js";
import { config } from "./src/config/config.js";
import connectDB from "./src/config/db.js";

// Define an asynchronous function to start the server
const startServer = async () => {
  // Connect to the database
  await connectDB();

  // Get the port from configuration, default to 3000 if not provided
  const port = config.port || 3000;

  // Start the server, listening on the specified port
  app.listen(port, () => {
    // Log a message to indicate the server has started
    console.log(`Listening on port: ${port}`);
  });
};

// Call the startServer function to start the server
startServer();

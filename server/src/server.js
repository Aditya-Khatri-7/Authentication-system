import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/database.js';
import { seedAdmin } from './config/seedAdmin.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database first, then start Server
const startServer = async () => {
  try {
    await connectDB();
    await seedAdmin();
    
    const server = app.listen(PORT, () => {
      console.log('Server running successfully');
      console.log(`Server listening on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Rejection Error: ${err.message}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

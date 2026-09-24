import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import forgotPasswordRoutes from './routes/forgotPasswordRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Mount Routes
app.use('/api/auth', forgotPasswordRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'Standalone Forgot Password Module API',
    endpoints: [
      'POST /api/auth/forgot-password',
      'POST /api/auth/verify-reset-otp',
      'POST /api/auth/resend-otp',
      'POST /api/auth/reset-password',
    ],
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Standalone Forgot Password Server running on http://localhost:${PORT}`);
});

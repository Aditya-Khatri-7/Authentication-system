# Standalone Forgot Password Feature System

This directory contains a complete, self-contained, and production-ready **Forgot Password & Password Reset System** extracted from the MERN Authentication system.

---

## 🌟 Key Features

* 🔐 **Cryptographically Secure OTP Generation**: Generates 6-digit numeric OTP codes.
* ⏱️ **Auto-Expiring Codes**: OTPs expire automatically after 10 minutes via MongoDB TTL Indexes.
* 🛡️ **Brute-Force & Attempt Limiting**: Automatically invalidates and locks OTP after 5 failed verification attempts.
* 📧 **HTML Email Templates with SMTP Support**: Sends branded responsive emails via Nodemailer with customizable SMTP parameters.
* 🖥️ **Console Fallback Mode**: Works out-of-the-box without configured SMTP credentials by outputting OTP logs to the terminal console during development.
* 🔒 **Session Cleanup**: Hashes passwords securely using `bcryptjs` and forces token/session invalidation upon successful password update.
* 💻 **React UI Components**: Clean modern UI screens using TailwindCSS and React Hook Form + Zod.

---

## 📂 Directory Structure

```
forgot-password/
├── README.md                           # Documentation
├── package.json                        # Node dependencies
├── .env.example                        # Configuration template
├── server/                             # Express Server & API Services
│   ├── server.js                       # Standalone Server entry point
│   ├── config/
│   │   └── db.js                       # MongoDB connection driver
│   ├── models/
│   │   ├── User.js                     # User Mongoose Schema
│   │   └── OTP.js                      # OTP Schema with TTL index
│   ├── services/
│   │   ├── emailService.js             # Nodemailer transporter & HTML emails
│   │   ├── otpService.js               # OTP generation, storage & validation
│   │   └── accountRecoveryService.js   # Forgot password core logic
│   ├── validators/
│   │   └── forgotPasswordValidator.js  # Input sanitization and rules
│   └── routes/
│       └── forgotPasswordRoutes.js     # API Route definitions
└── client/                             # React UI Pages
    ├── ForgotPassword.jsx              # Request OTP component
    ├── VerifyResetOtp.jsx              # Verify OTP component
    └── ResetPassword.jsx               # Reset Password component
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup & Run

1. Navigate into the `forgot-password` directory:
   ```bash
   cd forgot-password
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Start the standalone server:
   ```bash
   npm start
   ```
   *The server will run on `http://localhost:5000`.*

### 🧪 Run Automated Integration Verification Test

To automatically test the entire cycle (request OTP -> fetch OTP -> verify OTP -> reset password -> check database state), run:
```bash
node test-forgot-password.js
```
*(Make sure a local MongoDB instance is running on port 27017 or customize the MONGODB_URI in `.env` first).*

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description | Payload Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/forgot-password` | Request password reset OTP | `{ "email": "user@example.com" }` |
| `POST` | `/api/auth/verify-reset-otp` | Verify 6-digit OTP code | `{ "email": "user@example.com", "otp": "123456" }` |
| `POST` | `/api/auth/resend-otp` | Resend a fresh OTP code | `{ "email": "user@example.com", "purpose": "PASSWORD_RESET" }` |
| `POST` | `/api/auth/reset-password` | Set new account password | `{ "email": "user@example.com", "otp": "123456", "newPassword": "Password@123" }` |

---

## 📧 Email Configuration (SMTP)

To send real emails to inbox addresses, configure the following variables in `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_app_password
EMAIL_FROM="Enterprise Auth <noreply@yourdomain.com>"
```

*Note: If no SMTP details are supplied, OTPs will be printed to your terminal console for easy local testing.*

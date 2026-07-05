# Gatekeeper Auth System - Enterprise Backend

A production-ready, highly secure, and compliant Enterprise Authentication and Identity & Access Management (IAM) service.

---

## Technical Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ORM)
- **Security**: JWT, bcryptjs, Helmet, Express-Rate-Limit, CORS, Cookie-Parser
- **Transporter**: Nodemailer

---

## Architectural Principles
This project strictly enforces a **Layered Clean Architecture**:
```
Routes ──► Controllers ──► Services ──► Repositories ──► MongoDB
```
1. **Routes**: Mount endpoints, rate limiters, and verification middleware.
2. **Controllers**: Parse request properties (body, query, params) and return standard HTTP responses. They contain zero business logic.
3. **Services**: Contain all domain business logic, cryptographic checks, token generation, and audit logging.
4. **Repositories**: Execute database queries using Mongoose models. They contain zero business logic.

---

## Folder Structure
```
server/
├── src/
│   ├── config/              # Configuration (database, roles, swagger spec)
│   ├── controllers/         # Express Controllers
│   ├── middleware/          # JWT check, Authorization, Error formats
│   ├── models/              # Mongoose DB Schemas (User, OTP, AuditLog, Token)
│   ├── repositories/        # Database Access Layer
│   ├── routes/              # Express API Routes
│   ├── services/            # Core Domain Business Logic
│   ├── utils/               # Structured Logger, Custom Errors
│   ├── app.js               # Express application initialization
│   └── server.js            # Server launcher entrypoint
├── tests/                   # Consolidated Integration Test Suites
├── Dockerfile               # Production multi-stage Docker setup
├── docker-compose.yml       # Local orchestration stack
├── .dockerignore            # Excluded build paths
├── .env.example             # Environment configuration template
└── package.json             # NPM dependencies
```

---

## Standardized Responses

### Success Response Format (HTTP 200/201)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "user": {
      "id": "6a4a0aa8e0e4be77ff05bd98",
      "email": "user@auth.local"
    }
  }
}
```

### Failure Response Format (HTTP 4xx/5xx)
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "statusCode": 400,
    "details": "Password must contain at least one uppercase letter"
  },
  "requestId": "c2195325-1e35-48fa-8a56-4279069d2f25"
}
```

---

## Environment Variables
Create a `.env` file in the `server/` directory using these values:
- `PORT`: Server port (default `5000`)
- `NODE_ENV`: Target environment (`development` / `production`)
- `MONGODB_URI`: MongoDB Atlas cluster or local MongoDB connection string
- `JWT_SECRET`: Secure cryptographic key for short-lived access tokens
- `JWT_REFRESH_SECRET`: Secure key for long-lived refresh tokens
- `JWT_ACCESS_EXPIRATION`: Access token TTL (e.g. `15m`)
- `JWT_REFRESH_EXPIRATION`: Refresh token TTL (e.g. `7d`)
- `EMAIL_HOST`: SMTP server host
- `EMAIL_PORT`: SMTP server port (`587` / `465`)
- `EMAIL_USER`: SMTP user email ID
- `EMAIL_APP_PASSWORD`: SMTP secure app password
- `EMAIL_FROM`: Sender address header
- `FRONTEND_URL`: Client URL for CORS mapping (e.g. `http://localhost:5173`)

---

## Local Setup & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```

### 3. Run Production Build
```bash
npm start
```

### 4. Run Integration Tests
Connect your database, start the server, and execute:
```bash
node tests/run.js
```

---

## Docker Orchestration

### Build and Run with Docker Compose
Run both the Node backend and a local persistent MongoDB image:
```bash
docker-compose up --build
```
The API documentation will be available at `http://localhost:5000/api/docs`.

---

## Swagger API Documentation
OpenAPI 3.0.0 documentation is exposed directly by the server:
- **Interactive UI**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **JSON Specification**: [http://localhost:5000/api/docs/json](http://localhost:5000/api/docs/json)

---

## Production Deployment Guides

### 1. MongoDB Atlas Configuration
1. Create a MongoDB Atlas cluster.
2. In Network Access, whitelist the server IP (or `0.0.0.0/0` for dynamic hosting services).
3. Copy the cluster connection string, replacing `password` and `username`. Paste it into the `MONGODB_URI` environment variable.

### 2. Render Deployment
1. Create a new **Web Service** on Render and link your Git repository.
2. Set the Environment to **Node**.
3. Set the Build Command to `npm install` and Start Command to `node src/server.js`.
4. In Advanced Settings, add the Environment Variables matching the `.env.example`.

### 3. Railway Deployment
1. Create a new project on Railway.
2. Add your repository to deploy.
3. Railway automatically parses the `Dockerfile`. Under variables, add all variables defined in `.env.example`.

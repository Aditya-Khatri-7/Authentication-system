# Stage 1: Build and install production dependencies only
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Final lightweight execution container
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .

# Expose port and configure secure container boundaries
EXPOSE 5000
USER node

# Execute backend startup script
CMD ["node", "src/server.js"]

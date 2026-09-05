# Multi-stage production Dockerfile for NestJS API
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files & prisma schema
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install all dependencies
RUN npm install

# Copy full application code
COPY backend/ .

# Generate Prisma Client & Build NestJS application
RUN npx prisma generate
RUN npm run build

# ── Production Stage ──
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files & prisma schema
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install production dependencies
RUN npm install --omit=dev
RUN npx prisma generate

# Copy built application dist from builder
COPY --from=builder /app/dist ./dist

# Create uploads folder
RUN mkdir -p uploads

# Expose default port
EXPOSE 3000

# Start NestJS production server
CMD ["node", "dist/main"]

# Multi-stage production Dockerfile for NestJS API
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files & prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy full application code
COPY . .

# Generate Prisma Client & Build NestJS application
RUN npx prisma generate
RUN npm run build

# ── Production Stage ──
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files & prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production
RUN npx prisma generate

# Copy built application dist from builder
COPY --from=builder /app/dist ./dist

# Create uploads folder
RUN mkdir -p uploads

# Expose default port
EXPOSE 3000

# Start NestJS production server
CMD ["node", "dist/main"]

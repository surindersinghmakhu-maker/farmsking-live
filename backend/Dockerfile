# Production Dockerfile for NestJS API + Prisma
FROM node:20-slim

WORKDIR /app

# Copy package files & prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies & generate Prisma client
RUN npm install --legacy-peer-deps
RUN npx prisma generate

# Copy full application code
COPY . .

# Build NestJS application
RUN npm run build

# Create uploads folder
RUN mkdir -p uploads

# Expose default port
EXPOSE 3000

# Start NestJS production server
CMD ["node", "dist/main"]

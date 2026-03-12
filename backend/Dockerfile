FROM node:20-alpine

WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy source + prisma schema
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create DB directory and run migrations + seed
RUN mkdir -p /app/prisma

EXPOSE 3001

# On startup: push schema, seed if DB is new, then start
CMD sh -c "npx prisma db push --skip-generate && node prisma/seed.js && node src/index.js"

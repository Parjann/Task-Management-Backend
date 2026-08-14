##############################
# Stage 1 - Builder
##############################
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies needed for build
COPY package*.json ./
RUN npm ci

# Copy source code and Prisma schema
COPY . .

# Generate Prisma Client and build NestJS project
RUN npx prisma generate
RUN npm run build


##############################
# Stage 2 - Production Runner
##############################
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install wget for container health checks
RUN apk add --no-cache wget

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application and generated Prisma Client from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create directory for uploads if fallback local storage is accessed
RUN mkdir -p /app/uploads

EXPOSE 3001

HEALTHCHECK --interval=30s \
  --timeout=5s \
  --start-period=30s \
  --retries=3 \
  CMD wget --spider -q http://localhost:3001/health || exit 1

CMD ["node", "dist/main.js"]

# Stage 1: Build the NestJS application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false # Install dev dependencies for build

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Stage 2: Run the production application
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Copy production dependencies only
COPY --from=builder /app/package.json /app/yarn.lock ./
RUN yarn install --frozen-lockfile --production=true

# Copy built application from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules # Copy node_modules from builder (faster, avoids re-install)
COPY --from=builder /app/.env.example ./.env.example
COPY --from=builder /app/ormconfig.ts ./ormconfig.ts # Required for TypeORM CLI if running migrations in container

# Expose the application port
EXPOSE 3000

# Run migrations (Optional: Can also be run as a separate step in CI/CD or deployment script)
# This assumes the database is accessible at container start.
# In production, it's often better to have a dedicated migration job.
# CMD ["sh", "-c", "yarn migration:run && node dist/main"]

# Start the application
CMD ["node", "dist/main"]
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build
RUN yarn install --frozen-lockfile --production --ignore-scripts --prefer-offline

# Runtime stage
FROM node:18-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Run as non-root
USER node

# Copy the built artifacts & lean node_modules
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

CMD ["node", "dist/main"]

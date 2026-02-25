# Stage 1: Install production dependencies
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Stage 2: Production image
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY app.js ./
COPY bin/ ./bin/
COPY config/ ./config/
COPY controllers/ ./controllers/
COPY models/ ./models/
COPY public/ ./public/
COPY resources/ ./resources/
COPY routes/ ./routes/
COPY services/ ./services/
COPY utils/ ./utils/
COPY lighty-openapi.yml ./
USER node
EXPOSE 8080
CMD ["node", "./bin/www"]


# Dependencies
FROM node:22-bookworm-slim AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci


# Build application
FROM deps AS builder

WORKDIR /app
COPY . .

RUN npm run build


# Production runtime
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["node", "build"]

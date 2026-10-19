
# ==========================================
# 1. Dependencies
# ==========================================
FROM node:22-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci


# ==========================================
# 2. Build SvelteKit
# ==========================================
FROM deps AS builder

WORKDIR /app

COPY . .

ENV NODE_ENV=development

RUN npm run build


# ==========================================
# 3. Production
# ==========================================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json package-lock.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["node", "build"]

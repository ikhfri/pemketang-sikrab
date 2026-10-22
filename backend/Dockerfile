
# ============================================
# Stage 1: Build Go API
# ============================================
FROM golang:1.26-alpine AS builder

WORKDIR /app

RUN apk add --no-cache ca-certificates git

# Download dependencies first for build cache
COPY go.mod go.sum ./
RUN go mod download

# Copy backend source code
COPY . .

# Build API server (not database seeder)
RUN CGO_ENABLED=0 GOOS=linux go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /app/server \
    ./cmd/api

# ============================================
# Stage 2: Production runtime
# ============================================
FROM alpine:3.22 AS production

RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S app \
    && adduser -S -G app app

WORKDIR /app

# Copy compiled binary only
COPY --from=builder --chown=app:app /app/server ./server

ENV TZ=Asia/Jakarta

USER app

EXPOSE 8080

ENTRYPOINT ["./server"]

FROM golang:1.25-alpine AS builder

WORKDIR /app

RUN apk add --no-cache ca-certificates git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Ganti ./cmd/server dengan lokasi package main backend kamu.
ARG MAIN_PACKAGE=.
RUN CGO_ENABLED=0 GOOS=linux go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /app/server ${MAIN_PACKAGE}

FROM alpine:3.22

RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S app \
    && adduser -S -G app app

WORKDIR /app

COPY --from=builder /app/server ./server

ENV TZ=Asia/Jakarta
USER app

EXPOSE 8080

ENTRYPOINT ["./server"]
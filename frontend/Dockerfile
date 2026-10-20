# Build Vue 3 + Vite assets
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set this to the public URL used by the browser.
# For same-domain API routing through host Nginx, use https://voting.titiknol.site
ARG VITE_API_BASE_URL=https://voting.titiknol.site
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build


# Serve static files with Nginx
FROM nginx:1.28-alpine AS production

COPY nginx.frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

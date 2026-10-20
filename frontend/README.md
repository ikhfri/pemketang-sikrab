# SIKRABTEK 63 — Vue/Vite frontend deployment

## Files
- `Dockerfile`: multi-stage build; serves the production bundle with Nginx.
- `docker-compose.yml`: frontend container, bound only to `127.0.0.1:4173`.
- `nginx.frontend.conf`: static serving and Vue Router fallback.
- `HOST-NGINX.conf.example`: example for Nginx installed on the VPS host.

## Deploy
Run these commands from the frontend repository root (the directory containing `package.json` and these files):

```bash
cp .env.production.example .env.production
docker compose up -d --build
docker compose ps
curl -I http://127.0.0.1:4173/
```

`VITE_API_BASE_URL` is compiled into the bundle during image build. If changed, rebuild:

```bash
docker compose build --no-cache
docker compose up -d
```

## Host Nginx
Configure the host Nginx domain to proxy:
- `/` to `http://127.0.0.1:4173`
- `/api/` to `http://127.0.0.1:8080` (adjust to the actual Go backend port)

Then test/reload Nginx and enable HTTPS with Certbot after DNS points to the VPS:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d voting.titiknol.site
```

Do not run Certbot until DNS is correct and ports 80/443 are reachable.

## Backend note
The backend should publish its HTTP port on the host loopback, for example `127.0.0.1:8080:8080`, if host Nginx is proxying to `127.0.0.1:8080`. Keep your existing backend Compose configuration; do not replace it with this frontend-only Compose file.

If the frontend API client uses a different URL scheme or API prefix, adjust the `VITE_API_BASE_URL` and host Nginx routes to match the actual code.

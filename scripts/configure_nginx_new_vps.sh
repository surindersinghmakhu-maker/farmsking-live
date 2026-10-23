#!/usr/bin/env bash
set -e

echo "=== 1. Writing Nginx Site Configuration ==="
cat << 'EOF' > /etc/nginx/sites-available/farmsking
server {
    listen 443 ssl;
    server_name admin.farmsking.in;
    client_max_body_size 50M;

    root /var/www/farmsking-live/admin/dist;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/admin.farmsking.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.farmsking.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    location /uploads/ {
        alias /var/www/farmsking-live/backend/uploads/;
        expires 7d;
        add_header Cache-Control "public";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name farmsking.in www.farmsking.in farmsking.tech www.farmsking.tech 187.127.98.38 187.127.101.183;
    client_max_body_size 50M;

    root /var/www/farmsking-live/frontend/dist;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/farmsking.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/farmsking.tech/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    location /uploads/ {
        alias /var/www/farmsking-live/backend/uploads/;
        expires 7d;
        add_header Cache-Control "public";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80 default_server;
    server_name admin.farmsking.in farmsking.in www.farmsking.in farmsking.tech www.farmsking.tech 187.127.98.38 187.127.101.183;
    
    # Allow Direct IP testing over HTTP without SSL redirect
    location / {
        root /var/www/farmsking-live/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo "=== 2. Enabling Site and Testing Nginx ==="
rm -f /etc/nginx/sites-enabled/default || true
ln -sf /etc/nginx/sites-available/farmsking /etc/nginx/sites-enabled/farmsking
nginx -t
systemctl reload nginx

echo "=== 3. Testing Local HTTP and HTTPS ==="
curl -I http://127.0.0.1 || true
curl -k -I https://127.0.0.1 || true

echo "=== NGINX IS LIVE! ==="

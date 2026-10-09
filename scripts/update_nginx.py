import os

nginx_conf = """server {
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
    server_name farmsking.in www.farmsking.in farmsking.tech www.farmsking.tech 187.127.101.183;
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
    listen 80;
    server_name admin.farmsking.in farmsking.in www.farmsking.in farmsking.tech www.farmsking.tech 187.127.101.183;
    return 301 https://$host$request_uri;
}
"""

with open("/etc/nginx/sites-available/farmsking", "w") as f:
    f.write(nginx_conf.strip() + "\n")

print("Nginx config updated successfully")

# Zoo Improvement Proposals — static site image.
# Root index.html redirects to /docs/site/ (pre-built ZIPs explorer, committed).
# Served as static files by nginx on :80.
FROM mirror.gcr.io/library/nginx:1.27-alpine
COPY . /usr/share/nginx/html
EXPOSE 80

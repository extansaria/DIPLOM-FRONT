FROM node:18-alpine AS build

WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY frontend ./frontend
COPY index.html ./
RUN npm run build

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/bundle.js /usr/share/nginx/html/bundle.js
COPY --from=build /app/index.html /usr/share/nginx/html/index.html
COPY privacy.html /usr/share/nginx/html/privacy.html
COPY terms.html /usr/share/nginx/html/terms.html
COPY frontend /usr/share/nginx/html/frontend

EXPOSE 80

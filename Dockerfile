# Этап 1: Сборка
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx expo export -p web

# Этап 2: Раздача
FROM nginx:stable-alpine
# Копируем билд в стандартный корень Nginx
COPY --from=build /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 8081; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Фикс для статики Expo \
    location ~* ^/(_expo|assets)/ { \
        try_files $uri =404; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8081
CMD ["nginx", "-g", "daemon off;"]

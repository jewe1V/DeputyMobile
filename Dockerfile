# Этап 1: Сборка
FROM node:20-alpine as build
WORKDIR /app

ARG EXPO_PUBLIC_API_URL
ARG EXPO_PUBLIC_GEOCODER_API_KEY
ARG EXPO_PUBLIC_YAMAP_API_KEY

ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_GEOCODER_API_KEY=$EXPO_PUBLIC_GEOCODER_API_KEY
ENV EXPO_PUBLIC_YAMAP_API_KEY=$EXPO_PUBLIC_YAMAP_API_KEY

COPY package*.json ./
RUN npm install
COPY . .
RUN npx expo export -p web

# Этап 2: Раздача
FROM nginx:stable-alpine
# Копируем всё содержимое dist прямо в корень раздачи Nginx
COPY --from=build /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 8081; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Любой путь должен возвращать index.html для работы роутера \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Явно разрешаем статику \
    location ~* ^/(_expo|assets)/ { \
        try_files $uri =404; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8081
CMD ["nginx", "-g", "daemon off;"]

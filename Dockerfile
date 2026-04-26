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

COPY service-worker.js ./dist/service-worker.js

FROM nginx:stable-alpine
# Создаем папку pwa и кладем билд туда
RUN mkdir -p /usr/share/nginx/html/pwa
COPY --from=build /app/dist /usr/share/nginx/html/pwa

RUN echo 'server { \
    listen 8081; \
    root /usr/share/nginx/html; \
    absolute_redirect off; \
    \
    location /pwa/ { \
        alias /usr/share/nginx/html/pwa/; \
        index index.html; \
        # Любой путь внутри /pwa/ отправляем на index.html \
        try_files $uri $uri/ /pwa/index.html; \
    } \
    \
    # Редирект с корня контейнера \
    location = / { \
        return 301 /pwa/; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8081
CMD ["nginx", "-g", "daemon off;"]

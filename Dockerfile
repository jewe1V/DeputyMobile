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
# Очищаем стандартную папку
RUN rm -rf /usr/share/nginx/html/*
# Создаем структуру, которую ожидает baseUrl
RUN mkdir -p /usr/share/nginx/html/pwa
COPY --from=build /app/dist /usr/share/nginx/html/pwa

RUN echo 'server { \
    listen 8081; \
    # Отключаем редиректы с портом \
    absolute_redirect off; \
    \
    root /usr/share/nginx/html; \
    \
    location /pwa/ { \
        alias /usr/share/nginx/html/pwa/; \
        index index.html; \
        # Это "магия" для SPA роутинга: если путь не найден, отдаем index.html \
        try_files $uri $uri/ /pwa/index.html; \
    } \
    \
    # Редирект для удобства: с / на /pwa/ \
    location = / { \
        return 301 /pwa/; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8081
CMD ["nginx", "-g", "daemon off;"]

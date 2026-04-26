# Этап 1: Сборка
FROM node:20-alpine as build
WORKDIR /app

# Кэшируем зависимости
COPY package*.json ./
RUN npm install

# Копируем код и собираем
COPY . .
RUN npx expo export -p web

# Этап 2: Раздача
FROM nginx:stable-alpine

# Создаем папку pwa и копируем туда билд
RUN mkdir -p /usr/share/nginx/html/pwa
COPY --from=build /app/dist /usr/share/nginx/html/pwa

RUN echo 'server { \
    listen 8081; \
    # Отключаем абсолютные редиректы, чтобы порт 8081 не вылезал в браузере \
    absolute_redirect off; \
    \
    location /pwa/ { \
        alias /usr/share/nginx/html/pwa/; \
        index index.html; \
        # Важно: путь в try_files для alias указывается от корня файловой системы \
        try_files $uri $uri/ /pwa/index.html; \
    } \
    \
    # Если кто-то зашел в корень контейнера \
    location = / { \
        return 301 /pwa/; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8081
CMD ["nginx", "-g", "daemon off;"]

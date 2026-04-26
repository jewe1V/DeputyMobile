FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx expo export -p web
FROM nginx:stable-alpine
RUN mkdir -p /usr/share/nginx/html/pwa
COPY --from=build /app/dist /usr/share/nginx/html/pwa

RUN echo 'server { \
    listen 8081; \
    root /usr/share/nginx/html; \
    \
    location /pwa/ { \
        alias /usr/share/nginx/html/pwa/; \
        try_files $uri $uri/ /pwa/index.html; \
    } \
    \
    location = / { \
        return 301 /pwa/; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8081
CMD ["nginx", "-g", "daemon off;"]

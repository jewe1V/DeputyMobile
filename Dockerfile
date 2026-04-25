# Сборка
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx expo export -p web

# Раздача
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 8081
# Флаг -s важен для корректной работы роутинга в PWA
CMD ["serve", "-s", "dist", "-l", "8081"]

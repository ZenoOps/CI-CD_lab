# Base image
FROM node:20.11.1-alpine

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . .

RUN npm run build

# Serve with NGINX
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

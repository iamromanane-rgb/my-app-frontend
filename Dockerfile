# ---- Build Stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --silent 

# Copy source code
COPY public ./public
COPY src ./src

# Build arg for the backend API URL
ARG REACT_APP_API_URL=http://localhost:9090
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the production bundle
RUN npm run build

# ---- Runtime Stage ----
FROM nginx:stable-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static files from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

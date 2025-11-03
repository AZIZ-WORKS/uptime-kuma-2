FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Accept build-time API/WS URLs for Vite
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Build the frontend
RUN npm run build

EXPOSE 5173

ENV NODE_ENV=production

# Serve the built app with Vite preview (bind on all interfaces)
CMD ["npm", "run", "preview", "--", "--host", "--port", "5173"]




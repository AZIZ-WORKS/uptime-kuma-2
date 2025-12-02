FROM node:20-alpine

WORKDIR /app

# Install speedtest-cli and other dependencies
RUN apk add --no-cache python3 py3-pip curl && \
    pip3 install --break-system-packages speedtest-cli

COPY package.json ./
RUN npm install --only=production

COPY . ./

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "index.js"]




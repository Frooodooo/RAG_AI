FROM node:20-alpine

# Build tools needed for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json .
RUN npm install --production

COPY server.js .

# Persistent data volume
VOLUME /app/data
ENV DATA_DIR=/app/data
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server.js"]

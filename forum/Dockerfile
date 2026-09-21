# Debian base: better-sqlite3 ships prebuilt binaries for it, so there is no compile step.
FROM node:22-slim
WORKDIR /app
COPY forum/package.json ./
RUN npm install --omit=dev
COPY forum/ ./
ENV PORT=8080 DB_FILE=/data/forum.db
VOLUME /data
EXPOSE 8080
CMD ["npx", "tsx", "src/server.ts"]

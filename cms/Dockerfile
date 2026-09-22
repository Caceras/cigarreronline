# Build context is the repo root: the CMS shares content/schema.ts with the site.
FROM node:22-alpine
WORKDIR /app
COPY cms/package.json ./cms/
WORKDIR /app/cms
RUN npm install --omit=dev
WORKDIR /app
COPY content/schema.ts content/model.ts ./content/
COPY cms/ ./cms/
WORKDIR /app/cms
ENV PORT=8080 STAGING_FILE=/data/staging.json
VOLUME /data
EXPOSE 8080
CMD ["npx", "tsx", "src/server.ts"]

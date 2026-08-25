# DigitalOcean App Platform / production image for KEYLINK360
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Native optional deps (rollup/tailwind oxide) need Linux binaries at install time.
COPY package.json package-lock.json ./
RUN npm ci --include=optional

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --include=optional && npm cache clean --force

COPY --from=build /app/dist ./dist

ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.cjs"]

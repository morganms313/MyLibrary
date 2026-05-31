# syntax=docker/dockerfile:1
# MyLibrary (Next 16 + Prisma 7 + SQLite)
# Same reliable single-stage pattern as DnD. Prisma 7's `prisma-client` generator
# emits the client into src/generated/prisma (in the source tree), so a normal
# `next build` picks it up — no standalone tracing needed.
FROM node:22-bookworm-slim
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Prisma engines + outbound HTTPS need OpenSSL + CA certs (absent from -slim).
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev

COPY . .
RUN npx prisma generate && npm run build

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
EXPOSE 3000

# Create/sync the SQLite schema on the mounted /data volume, then start Next.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && exec npm run start"]

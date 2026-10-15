FROM node:20-bookworm-slim

# Install PostgreSQL and system tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql postgresql-contrib curl procps openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manifests and .npmrc
COPY .npmrc ./
COPY package*.json ./
COPY api/package*.json ./api/
COPY web/package*.json ./web/

# Install dependencies across all workspaces
RUN npm install --legacy-peer-deps

# Copy source code and Prisma schema
COPY . .

# Generate Prisma Client
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edtech?schema=public"
RUN npx prisma generate

# Build both API and Web
ENV NEXT_PUBLIC_API_URL=/api
RUN npm run build

# Ensure entrypoint is executable
RUN chmod +x /app/entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000
ENV API_PORT=8080
ENV INTERNAL_API_URL="http://127.0.0.1:8080/api/:path*"

EXPOSE 3000

CMD ["/app/entrypoint.sh"]

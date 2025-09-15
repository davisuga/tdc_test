FROM oven/bun:1.2.21-slim

WORKDIR /app

# Copy package files
COPY package.json ./
COPY bun.lock ./

# Install dependencies
RUN bun install --production
RUN apt-get update -y && apt-get install -y openssl
COPY . .
RUN bun prisma generate
# Copy application code

# Expose the port
EXPOSE 3000


# Run the application
CMD ["bun", "run", "src/index.ts"]

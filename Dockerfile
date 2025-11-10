# Use official Bun base image
FROM oven/bun:latest

# Install git
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Clone your repo (HTTPS or SSH)
RUN git clone https://github.com/jfix/si-notifier.git .

# Install dependencies
RUN bun install

# Default command (change as needed)
CMD ["bun", "run", "src/check.ts"]

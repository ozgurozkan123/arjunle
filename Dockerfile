FROM node:20-slim

# Install system dependencies and Arjun CLI (Python)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && pip3 install --no-cache-dir arjun \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

# Build Next.js
RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]

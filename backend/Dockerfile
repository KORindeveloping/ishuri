FROM node:20-bookworm-slim

# Install dependencies for Ollama and Prisma
RUN apt-get update && apt-get install -y curl openssl procps && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Set Ollama host to 0.0.0.0
ENV OLLAMA_HOST=0.0.0.0
ENV PORT=10000

WORKDIR /usr/src/app

# Copy package info
COPY package*.json ./
COPY prisma ./prisma/

# Install Node dependencies and generate Prisma client
RUN npm install
RUN npx prisma generate

# Copy the rest of the backend source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose Render's default port
EXPOSE 10000

# Create an entrypoint script to run both Ollama and Node
RUN echo '#!/bin/bash\n\
echo "Starting Ollama service..."\n\
ollama serve &\n\
OLLAMA_PID=$!\n\
\n\
echo "Waiting for Ollama to be ready..."\n\
while ! curl -s http://127.0.0.1:11434/api/tags > /dev/null; do\n\
  sleep 2\n\
done\n\
\n\
echo "Ollama is ready. Pulling gemma3:4b model..."\n\
ollama pull gemma3:4b\n\
\n\
echo "Starting Node.js application..."\n\
npm start\n\
' > start.sh && chmod +x start.sh

CMD ["./start.sh"]

FROM node:20-alpine

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

# Start Node.js application directly
CMD ["npm", "start"]

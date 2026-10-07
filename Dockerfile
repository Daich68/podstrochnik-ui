FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

RUN npm install -g serve

# Expose the port for your app
EXPOSE 3003

# Serve the production build
CMD ["serve", "-s", "build", "-l", "3003"]

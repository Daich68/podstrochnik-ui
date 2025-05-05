# Use an official Node.js runtime as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies using Yarn
RUN yarn install

# Copy all app files to the working directory
COPY . .

# Build the React app for production
RUN yarn build

# Install a simple static file server to serve the build files
RUN yarn global add serve

# Expose the port for your app
EXPOSE 3003

# Serve the production build
CMD ["serve", "-s", "build", "-l", "3003"]
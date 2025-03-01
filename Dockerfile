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

# Expose the port on which your app will run
EXPOSE 3003

# Start the React app
CMD ["yarn", "start"]
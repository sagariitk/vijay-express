# base image of node
FROM node:8.14.0

# Create app directory
WORKDIR /usr/src/app

# Expose port for service
EXPOSE 1337

# Copy source code to image
COPY . .

# Install dependencies whill creating image
RUN npm install

# will run when container will be running
CMD npm start

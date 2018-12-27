FROM node:10-alpine

# Reduce npm install verbosity, overflows Travis CI log view
ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV production

RUN mkdir -p /var/c-blinken
WORKDIR /var/c-blinken
COPY . /var/c-blinken

# Install NoFlo and dependencies
RUN npm install --only=production

# Map the volumes
VOLUME /var/c-blinken/animations

CMD npm start

FROM node:12 as builder
# build steps
WORKDIR /app
COPY . .
## Nest.js project build
RUN npm install
RUN npm run build

# run steps
FROM node:12-alpine
WORKDIR /app
COPY --from=builder /app ./

LABEL key="Micael Rodrigues"
ENV NODE_ENV=production
ENV PORT=5000
ENV GAME_SERVICE="capitalise-service"
ENV GAME_SERVICE_PORT="8080"
EXPOSE $PORT

ENTRYPOINT ["npm", "run", "start:prod"]
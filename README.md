# MS Game Data

Run a game statistics micro-service built with [NestJs](https://nestjs.com/)

Service depends on container [capitalisers/coding-test-game-data](https://hub.docker.com/r/capitalisers/coding-test-game-data) for game data service.

Services caches remote service data in 1 hour and retries failed requests in 5 minutes

## Available endpoints on `http://<YOUR_HOST>:<YOUR_PORT>`

- `stats/login` - Authenticate a sample user and get `JWT (Json Web Token)` (`id: ea, password: changeme`)

> After getting the token use Bearer Token authorization on subsequent requests

- `stats/login` - get all statistics

- `stats/grouped` - get all statistics grouped by first letter

- `stats/top` - get top 5, 10 and 100 statistics

- `stats/top:number` - get top statistics for the provided `number` argument

## Running

You can run the project locally or through docker

### Running locally

- `docker pull capitalisers/coding-test-game-data` and map port `8080` and start the container
- `nest start` to start the service on port `3000`

### Running through docker-compose

- `docker-compose up` to build and start containers

> (first request to game data service will fail so it use a cached file. After 5 minutes data service will be hit again, this time with success and new game data)

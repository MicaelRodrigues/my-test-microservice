const HOUR_IN_SECONDS = 60 * 60;
export default {
    APP_PORT: parseInt(process.env.PORT, 10) || 3000,
    CACHE_INTERVAL: HOUR_IN_SECONDS * 1000, // 1 hour,
    CACHE_TTL: HOUR_IN_SECONDS,
    CACHE_FILE: 'gameData.json',
    REMOTE_RETRY_INTERVAL: 300 * 1000, // 5 minutes (ms)
    REMOTE_SERVICE_ENDPOINT: `http://${process.env.GAME_SERVICE || 'localhost'}:${process.env.GAME_SERVICE_PORT ||
        '8080'}`,
    STATS_UPDATE_MESSAGE: 'StatsUpdated',
    JWT_KEY: 'neverToExposePublicly',
    JWT_EXPIRATION: '300s' // 5 minutes
};

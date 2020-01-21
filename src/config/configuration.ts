const HOUR_IN_SECONDS = 60 * 60;
export default {
    APP_PORT: parseInt(process.env.PORT, 10) || 3000,
    CACHE_INTERVAL: HOUR_IN_SECONDS * 1000, // 1 hour,
    CACHE_TTL: HOUR_IN_SECONDS,
    REMOTE_SERVICE_ENDPOINT: 'http://localhost:8080'
};

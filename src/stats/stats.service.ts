import { Injectable, HttpService, OnModuleInit, Logger, UseInterceptors, CacheInterceptor } from '@nestjs/common';
import { Statistic } from './objects/Statistic';
import { sortByPopularity, writeStatisticsToFile, sortAlphabetically } from './utils/utils';
import { Statistics } from './objects/Statistics';
import { GameService } from './objects/GameService';
import { Interval } from '@nestjs/schedule';
import configuration from 'src/config/configuration';

@Injectable()
@UseInterceptors(CacheInterceptor)
export class StatsService implements OnModuleInit {
    // TODO: Use a singleton logger
    private logger = new Logger(StatsService.name);
    private cachedStatistics: Statistic[] = [];
    constructor(private readonly http: HttpService) {}

    async onModuleInit() {
        await this.loadStatistics();
        // TODO: // Implement cache policy to refresh
        // - Check how manage cache with Cache Module:
        // -- After ttl (1 hour) regenerate stats once (as in onModuleInit)
        // Login client
        // --> https://auth0.com/blog/full-stack-typescript-apps-part-1-developing-backend-apis-with-nestjs/
    }

    // Set an interval to refresh statistics
    @Interval(configuration.CACHE_INTERVAL)
    async handleInterval() {
        this.logger.debug('Updating statistics');
        await this.loadStatistics();
    }

    async getAll(): Promise<Statistics> {
        const top5 = await this.getTop(5);
        const top10 = await this.getTop(10);
        const top100 = await this.getTop(100);
        const byLetter = await this.getGroupedByFirstLetter();
        return {
            top5,
            top10,
            top100,
            ...byLetter // some are numbers (maybe group by first found letter)
        } as Statistics;
    }

    async getTop(n: number): Promise<Statistic[]> {
        return this.cachedStatistics.slice(0, n);
    }

    private async getGroupedByFirstLetter(): Promise<Statistics> {
        return [...this.cachedStatistics].sort(sortAlphabetically).reduce((acc, e) => {
            // get first letter
            const letterKey = e.name[0].toLowerCase();
            if (!acc[letterKey]) {
                // if there is no property with this letter create it
                acc[letterKey] = [e];
            } else {
                // push other statistic to array for that letter
                acc[letterKey].push(e);
            }
            return acc;
        }, {} as Statistics);
    }

    private async loadStatistics(): Promise<void> {
        const isHealthy = await this.isServiceHealthy();
        this.logger.debug(`Service is ${isHealthy ? '' : 'not '}healthy`);
        if (isHealthy) {
            // Get Updated statistics
            this.cachedStatistics = await this.fetchStatistics();
            // Update cache file
            writeStatisticsToFile(this.cachedStatistics, this.logger);
        } else {
            // returned last cached file (assume is already sorted by popularity on last write)
            const gameData = await import('../../offline/gameData.json');
            this.cachedStatistics = gameData;
        }
    }

    private async getServiceHealth(): Promise<GameService> {
        const response = await this.http.get(`${configuration.REMOTE_SERVICE_ENDPOINT}/api/v1/healthcheck`).toPromise();
        return response.data as GameService;
    }

    /**
     * Check weather remote service is healthy
     */
    private async isServiceHealthy(): Promise<boolean> {
        try {
            const service = await this.getServiceHealth();
            return service.status === 'UP' && service.services.schedules === 'UP';
        } catch (err) {
            this.logger.debug(err.message);
            // request error: assume server down
            return false;
        }
    }
    /**
     * Fetch statistics to game web service
     */
    private async fetchStatistics(): Promise<Statistic[]> {
        try {
            const response = await this.http.get(`${configuration.REMOTE_SERVICE_ENDPOINT}/api/v1/games/`).toPromise();
            return response.data.sort(sortByPopularity);
        } catch (err) {
            this.logger.error(`Server error: ${err.message}`);
            this.logger.debug(`Using cached statistics`);
            // returned last cached objects
            return this.cachedStatistics;
        }
    }
}

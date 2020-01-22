import { Injectable, HttpService, OnModuleInit, Logger } from '@nestjs/common';
import { Statistic } from './objects/Statistic';
import { sortByPopularity, writeStatisticsToFile, sortAlphabetically, largeSum } from './utils/utils';
import { Statistics } from './objects/Statistics';
import { GameService } from './objects/GameService';
import { Interval } from '@nestjs/schedule';
import configuration from 'src/config/configuration';
import { GroupedStatistics } from './objects/GroupedStatistics';
import cachedData from '../../offline/gameData.json';

@Injectable()
export class StatsService implements OnModuleInit {
    // TODO: Use a singleton logger
    private logger = new Logger(StatsService.name);
    private cachedStatistics: Statistic[] = [];
    constructor(private readonly http: HttpService) {}

    onModuleInit() {
        // Force synchronous run to avoid caching before first load
        (async() => await this.loadStatistics())();
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

    /**
     * Get all statistics Statistics and GroupedStatistics
     */
    async getAll(): Promise<Statistics | GroupedStatistics> {
        const { top5, top10, top100 } = await this.getAllTop();
        const byLetter = await this.getGroupedByFirstLetter();
        return {
            top5,
            top10,
            top100,
            ...byLetter // some are numbers (maybe group by first found letter)
        };
    }

    /**
     * Get all top stats
     */
    async getAllTop(): Promise<Statistics> {
        const top5 = await this.getTop(5);
        const top10 = await this.getTop(10);
        const top100 = await this.getTop(100);
        return {
            top5,
            top10,
            top100
        } as Statistics;
    }

    async getTop(n: number): Promise<Statistic[]> {
        return this.cachedStatistics.slice(0, n);
    }

    async getGroupedByFirstLetter(): Promise<GroupedStatistics> {
        return [...this.cachedStatistics].sort(sortAlphabetically).reduce((acc, e) => {
            const letterKey = e.name[0].toLowerCase();
            if (!acc[letterKey]) {
                // if there is no property with this letter create it
                acc[letterKey] = {
                    games: [e],
                    totalPopularity: String(e.popularity),
                    totalGames: 1
                };
            } else {
                // push other statistic to array for that letter
                acc[letterKey].games.push(e);
                acc[letterKey].totalPopularity = largeSum(String(acc[letterKey].totalPopularity), String(e.popularity));
                acc[letterKey].totalGames += 1;
            }
            return acc;
        }, {} as GroupedStatistics);
    }

    private async loadStatistics(): Promise<void> {
        
        const isHealthy = await this.isServiceHealthy();
        this.logger.debug(`Service is ${isHealthy ? '' : 'not '}healthy`);
        if (isHealthy) {
            // Get Updated statistics
            this.cachedStatistics = await this.fetchStatistics();
        }
        if (this.cachedStatistics.length === 0) {
            // returned last cached file (assume is already sorted by popularity on last write)
            this.cachedStatistics = cachedData;
        } else {
            // Update cache file with last request
            writeStatisticsToFile(this.cachedStatistics, this.logger);
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

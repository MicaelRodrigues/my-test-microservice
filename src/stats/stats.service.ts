import { Injectable, HttpService, OnModuleInit, Logger } from '@nestjs/common';
import { ClientProxy, Client } from '@nestjs/microservices';
import { Statistic } from './objects/Statistic';
import { sortByPopularity, writeStatisticsToFile, sortAlphabetically, largeSum } from './utils/utils';
import { Statistics } from './objects/Statistics';
import { GameService } from './objects/GameService';
import { Interval } from '@nestjs/schedule';
import configuration from '../config/configuration';
import { GroupedStatistics } from './objects/GroupedStatistics';
import cachedData from '../../offline/gameData.json';
import { Transport } from '@nestjs/common/enums/transport.enum';

@Injectable()
export class StatsService implements OnModuleInit {
    // TODO: Use a singleton logger
    private static logger = new Logger(StatsService.name);
    private cachedStatistics: Statistic[] = [];
    private endPointInError: boolean;

    @Client({ transport: Transport.KAFKA /* Or other Message broker */ })
    private client: ClientProxy;

    constructor(private readonly http: HttpService) {
        this.endPointInError = false;
    }

    async onModuleInit() {
        // Force synchronous run to avoid caching before first load
        await this.loadStatistics();
    }

    // Set an interval to refresh statistics
    @Interval(configuration.CACHE_INTERVAL)
    async handleInterval() {
        StatsService.logger.debug('Fetching new statistics from game service');
        await this.loadStatistics();
    }

    @Interval(configuration.REMOTE_RETRY_INTERVAL)
    async handleCircuitInterval() {
        if (this.inError) {
            // Remove error flag (if requests fails again it will be set in method)
            this.inError = false;
            StatsService.logger.debug('Retrying requests to game service');
            await this.loadStatistics();
        }
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

    /**
     * Publish data updates to subscribers
     */
    private publishStatistics() {
        if (this.client) {
            StatsService.logger.log('Publishing updates to broker');
            this.client.emit<Statistics[]>(configuration.STATS_UPDATE_MESSAGE, this.cachedStatistics);
        }
        // TODO: Get a way to force CacheModule refresh
    }

    /**
     * Load/Refresh statistics data
     */
    private async loadStatistics(): Promise<void> {
        const isHealthy = await this.isServiceHealthy();
        StatsService.logger.debug(`Service is ${isHealthy ? '' : 'not '}healthy`);
        if (isHealthy) {
            // Get Updated statistics
            this.cachedStatistics = await this.fetchStatistics();
        }
        // There are no stats
        if (this.cachedStatistics.length === 0) {
            // returned last cached file (assume is already sorted by popularity on last write)
            this.cachedStatistics = cachedData;
        } else {
            // Update cache file with last request
            writeStatisticsToFile(this.cachedStatistics, StatsService.logger);
        }

        // Publish statistics
        this.publishStatistics();
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
            StatsService.logger.debug(err.message);
            // request error: assume server down and mark endpoint in error
            this.inError = true;
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
            // Mark endpoint in error
            this.inError = true;
            StatsService.logger.error(`Server error: ${err.message}`);
            StatsService.logger.debug(`Using cached statistics`);
            // returned last cached objects
            return this.cachedStatistics;
        }
    }

    /**
     * Getter for endPointInError
     */
    get inError(): boolean {
        return this.endPointInError;
    }

    /** Setter for endPointInError */
    set inError(state: boolean) {
        this.endPointInError = state;
    }
}

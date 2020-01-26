import { Injectable, HttpService, OnModuleInit, Logger } from '@nestjs/common';
import { ClientProxy, Client } from '@nestjs/microservices';
import { Statistic } from './objects/Statistic';
import { sortByPopularity, writeStatisticsToFile, sortAlphabetically, largeSum } from './utils/utils';
import { Statistics } from './objects/Statistics';
import { GameService } from './objects/GameService';
import { Interval } from '@nestjs/schedule';
import configuration from '../config/configuration';
import { GroupedStatistics } from './objects/GroupedStatistics';
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
        try {
            // Run health check
            await this.runHealthCheck();
            // Get Updated statistics
            this.cachedStatistics = await this.fetchStatistics();
        } catch (err) {
            StatsService.logger.error(err.message);
            StatsService.logger.debug('...Using cached statistics');
            if (this.cachedStatistics.length === 0) {
                // Only load if nothing is in memory
                this.cachedStatistics = await this.fetchStatisticsFromFile();
            }
        }

        // Always publish statistics when load happens (even if using cached data)
        this.publishStatistics();
    }

    /**
     * Check weather remote service is healthy
     */
    private async runHealthCheck(): Promise<void> {
        let isHealthy: boolean = false;
        try {
            const service = await this.getServiceHealth();
            isHealthy = service.status === 'UP' && service.services.schedules === 'UP';
        } catch (err) {
            // request error: assume server down and mark endpoint in error
            StatsService.logger.error(err.message);
            this.inError = true;
        }
        StatsService.logger.debug(`Games Service is ${isHealthy ? '' : 'not '}healthy`);
        if (!isHealthy) {
            // TODO: perform Monitoring, Orchestration, Reaction ...
            throw new Error(`Games Service is failing`);
        }
    }

    /**
     * Request remote service health status
     */
    private async getServiceHealth(): Promise<GameService> {
        const response = await this.http.get(`${configuration.REMOTE_SERVICE_ENDPOINT}/api/v1/healthcheck`).toPromise();
        return response.data as GameService;
    }

    /**
     * Fetch statistics to game web service
     */
    private async fetchStatistics(): Promise<Statistic[]> {
        try {
            const response = await this.http.get(`${configuration.REMOTE_SERVICE_ENDPOINT}/api/v1/games/`).toPromise();
            const sortedGames = response.data.sort(sortByPopularity) as Statistic[];
            if (sortedGames.length > 0) {
                // Update cache file with last request (Only write when there's data)
                writeStatisticsToFile(sortedGames, StatsService.logger);
            }
            return sortedGames;
        } catch (err) {
            // Mark endpoint in error
            this.inError = true;
            throw new Error(`Server error: ${err.message}`);
        }
    }

    /**
     * Load statistics from cached file. If empty return empty array
     */
    private async fetchStatisticsFromFile(): Promise<Statistic[]> {
        return (await (await import(`../../offline/${configuration.CACHE_FILE}`)).default) || [];
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

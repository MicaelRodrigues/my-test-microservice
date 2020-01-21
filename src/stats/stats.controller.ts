import { Controller, Get, Param, UseInterceptors, CacheInterceptor } from '@nestjs/common';
import { Statistic } from './objects/Statistic';
import { StatsService } from './stats.service';

@Controller('stats')
@UseInterceptors(CacheInterceptor)
export class StatsController {
    constructor(private readonly statsService: StatsService) {}

    @Get()
    async getAll() {
        return this.statsService.getAll();
    }

    @Get(':top')
    async getTop(@Param('top') top: number): Promise<Statistic[]> {
        return this.statsService.getTop(top);
    }
}

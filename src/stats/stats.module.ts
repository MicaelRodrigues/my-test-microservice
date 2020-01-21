// src/items/items.module.ts

import { Module, HttpModule, CacheModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import configuration from '../config/configuration';

@Module({
    imports: [
        CacheModule.register({
            ttl: configuration.CACHE_TTL
        }),
        ScheduleModule.forRoot(),
        HttpModule
    ],
    providers: [StatsService],
    controllers: [StatsController]
})
export class StatsModule {}

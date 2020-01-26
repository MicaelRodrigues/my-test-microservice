// src/items/stats.module.ts

import { Module, HttpModule, CacheModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import configuration from '../config/configuration';
import { AuthModule } from '../auth/auth.module';
import { ClientStoreModule } from '../clients/clients.module';

@Module({
    imports: [
        CacheModule.register({
            ttl: configuration.CACHE_TTL
        }),
        ScheduleModule.forRoot(),
        HttpModule,
        ClientStoreModule,
        AuthModule
    ],
    providers: [StatsService],
    controllers: [StatsController]
})
export class StatsModule {}

// src/items/items.module.ts

import { Module, HttpModule, CacheModule } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

@Module({
    imports: [CacheModule.register({
        ttl: 60,
    }), HttpModule],
    providers: [StatsService],
    controllers: [StatsController],
})
export class StatsModule {}

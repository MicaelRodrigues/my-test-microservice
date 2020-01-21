import { Module } from '@nestjs/common';
import { StatsController } from './stats/stats.controller';
import { StatsService } from './stats/stats.service';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [StatsModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class AppModule {}

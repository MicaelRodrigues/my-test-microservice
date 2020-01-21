import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { StatsModule } from './stats/stats.module';

const APP_PORT = 3000 as const;

const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create(StatsModule);
  await app.listen(APP_PORT, () => {
    logger.debug(`Miscroservice is running...`);
  });

}
bootstrap();

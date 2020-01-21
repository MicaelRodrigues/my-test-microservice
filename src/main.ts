import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { StatsModule } from './stats/stats.module';
import configuration from './config/configuration';

const logger = new Logger('Main');

async function bootstrap() {
    const app = await NestFactory.create(StatsModule);
    await app.listen(configuration.APP_PORT, () => {
        logger.debug(`Miscroservice is running on ${configuration.APP_PORT}...`);
    });
}
bootstrap();

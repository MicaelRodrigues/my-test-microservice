import { Test, TestingModule } from '@nestjs/testing';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { CacheModule, HttpModule } from '@nestjs/common';
import { ClientStoreModule } from '../clients/clients.module';
import { AuthModule } from '../auth/auth.module';

describe('StatsController', () => {
    let appController: StatsController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            imports: [CacheModule.register(), HttpModule, ClientStoreModule, AuthModule],
            controllers: [StatsController],
            providers: [StatsService]
        }).compile();
        await app.init();
        appController = app.get<StatsController>(StatsController);
    });

    describe('root', () => {
        it('should return the top 5 stats', async () => {
            expect((await appController.getTop(5)).length).toBe(5);
        });
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ClientStoreService } from './clients.service';

describe('ClientsService', () => {
    let service: ClientStoreService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ClientStoreService]
        }).compile();

        service = module.get<ClientStoreService>(ClientStoreService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});

import { Module } from '@nestjs/common';
import { ClientStoreService } from './clients.service';

@Module({
    providers: [ClientStoreService],
    exports: [ClientStoreService]
})
export class ClientStoreModule {}

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { ClientStoreModule } from '../clients/clients.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import configuration from '../config/configuration';

@Module({
    imports: [
        ClientStoreModule,
        PassportModule,
        JwtModule.register({
            secret: configuration.JWT_KEY,
            signOptions: { expiresIn: configuration.JWT_EXPIRATION }
        })
    ],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService]
})
export class AuthModule {}

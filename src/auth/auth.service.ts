import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientStoreService, ClientDTO } from '../clients/clients.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private readonly clientStore: ClientStoreService, private readonly jwtService: JwtService) {}

    async validateClient(clientObject: ClientDTO): Promise<ClientDTO | null> {
        const { id, password } = clientObject;
        const client = await this.clientStore.find(id);
        if (client && client.password === password) {
            delete client.password;
            return client;
        }
        return null;
    }

    async login(payload: any) {
        if (!ClientStoreService.isValidClientObject(payload)) {
            throw new UnauthorizedException(
                'Invalid Request arguments. Structure should be { id: string, password: string }'
            );
        }
        const client = await this.validateClient(payload as ClientDTO);
        if (!client) {
            throw new UnauthorizedException('Invalid client access');
        }

        return {
            access_token: this.jwtService.sign({ id: client.id })
        };
    }
}

import { Injectable } from '@nestjs/common';

export interface ClientDTO {
    id: string;
    password: string;
}

@Injectable()
export class ClientStoreService {
    private readonly clients: ClientDTO[];

    constructor() {
        this.clients = [
            {
                id: 'ea',
                password: 'changeme'
            },
            {
                id: 'activision',
                password: 'secret'
            },
            {
                id: 'rockstar',
                password: 'guess'
            }
        ];
    }

    /**
     * Find client
     * @param id client identifier
     */
    async find(id: string): Promise<ClientDTO | undefined> {
        return this.clients.find(client => client.id === id);
    }

    /**
     * Check if object is a valid client object
     * @param object
     */
    static isValidClientObject(object: any): boolean {
        return (
            object &&
            object.id && typeof object.id === 'string' &&
            object.password && typeof object.password === 'string'
        );
    }
}

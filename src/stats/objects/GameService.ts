export type ServiceStatus = 'UP' | 'DOWN';
export interface GameService {
    status: ServiceStatus;
    services: {
        schedules: ServiceStatus;
    };
}

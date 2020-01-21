export const SERVICE_HOST = 'localhost' as const;
export const SERVICE_PORT = 8080 as const;
export type ServiceStatus = 'UP' | 'DOWN';
export interface GameService {
    status: ServiceStatus;
    services: {
        schedules: ServiceStatus;
    };
}

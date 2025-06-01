import { IServiceContainer } from './types';

export class ServiceContainer implements IServiceContainer {
    private services = new Map<string, any>();

    register<T>(key: string, service: T): void {
        if (this.services.has(key)) {
            // Only warn for certain critical services that shouldn't be recreated
            if (['application', 'gameLoop', 'config'].includes(key)) {
                console.warn(`⚠️ Critical service '${key}' is being overwritten. This may indicate an infinite loop or multiple initialization.`);
            }
        }
        this.services.set(key, service);
    }

    get<T>(key: string): T {
        const service = this.services.get(key);
        if (!service) {
            throw new Error(`Service with key '${key}' not found`);
        }
        return service as T;
    }

    has(key: string): boolean {
        return this.services.has(key);
    }

    clear(): void {
        this.services.clear();
    }
}

// Global service container instance
export const serviceContainer = new ServiceContainer();

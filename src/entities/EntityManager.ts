import { Entity } from './Entity';
import { serviceContainer } from '@/core/ServiceContainer';
import { Application } from '@/core/Application';

export class EntityManager {
    private entities = new Map<string, Entity>();
    private application: Application;

    constructor() {
        this.application = serviceContainer.get<Application>('application');
    }

    createEntity(): Entity {
        const entity = new Entity();
        this.entities.set(entity.id, entity);

        // Add entity to the game container
        this.application.getGameContainer().addChild(entity.container);

        return entity;
    }

    destroyEntity(id: string): boolean {
        const entity = this.entities.get(id);
        if (!entity) {
            return false;
        }

        entity.destroy();
        this.entities.delete(id);
        return true;
    }

    getEntity(id: string): Entity | undefined {
        return this.entities.get(id);
    }

    getAllEntities(): Entity[] {
        return Array.from(this.entities.values());
    }
    getEntitiesWithComponent(componentType: string): Entity[] {
        return this.getAllEntities().filter(entity =>
            entity.hasComponent(componentType)
        );
    }

    getEntitiesWithComponents(componentTypes: string[]): Entity[] {
        return this.getAllEntities().filter(entity =>
            componentTypes.every(type => entity.hasComponent(type))
        );
    } clear(): void {
        for (const entity of this.entities.values()) {
            entity.destroy();
        }
        this.entities.clear();
    }

    getEntityCount(): number {
        return this.entities.size;
    } update(_deltaTime: number): void {
        // Update all entities - this could be enhanced to call entity update methods
        // For now, this is a placeholder to satisfy the interface
    }
}

import { ISystem } from '@/core/types';
import { serviceContainer } from '@/core/ServiceContainer';
import { EntityManager } from '@/entities/EntityManager';
import { TransformComponent } from '@/components/TransformComponent';
import { RenderComponent } from '@/components/RenderComponent';
import { PhysicsComponent } from '@/components/PhysicsComponent';
import { RigidBodyComponent } from '@/components/RigidBodyComponent';

export class TransformSystem implements ISystem {
    public readonly name = 'transform';
    private entityManager: EntityManager;

    constructor() {
        this.entityManager = serviceContainer.get<EntityManager>('entityManager');
    } update(_deltaTime: number): void {
        // Get all entities that have both transform and render components
        const entities = this.entityManager.getEntitiesWithComponents(['transform', 'render']);

        for (const entity of entities) {
            const transform = entity.getComponent<TransformComponent>('transform');
            const render = entity.getComponent<RenderComponent>('render');

            if (!transform || !render) continue;

            // Check for RigidBodyComponent first (newer physics component)
            const rigidBody = entity.getComponent<RigidBodyComponent>('rigidbody');
            if (rigidBody && !rigidBody.options.isStatic) {
                // Sync physics body position to transform
                transform.position.x = rigidBody.body.position.x;
                transform.position.y = rigidBody.body.position.y;
                transform.rotation = rigidBody.body.angle;
            } else {
                // Check for legacy PhysicsComponent
                const physics = entity.getComponent<PhysicsComponent>('physics');
                if (physics && !physics.isStatic) {
                    transform.position.x = physics.body.position.x;
                    transform.position.y = physics.body.position.y;
                    transform.rotation = physics.body.angle;
                }
            }

            // Sync transform data to the render object
            render.displayObject.position.set(transform.position.x, transform.position.y);
            render.displayObject.rotation = transform.rotation;
            render.displayObject.scale.set(transform.scale.x, transform.scale.y);

            // Add the display object to entity container if not already added
            if (!entity.container.children.includes(render.displayObject)) {
                entity.container.addChild(render.displayObject);
            }
        }
    }

    destroy(): void {
        // Cleanup if needed
    }
}

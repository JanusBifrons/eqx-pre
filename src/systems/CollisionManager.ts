import { Events, Body } from 'matter-js';
import { useGameStore } from '@/store/gameStore';
import { Vector2 } from '@/core/types';

export interface CollisionEvent {
    entityA: string;
    entityB: string;
    bodyA: Body;
    bodyB: Body;
    pairs: CollisionPair[];
    timestamp: number;
}

export interface CollisionPair {
    bodyA: Body;
    bodyB: Body;
    contactPoints: Vector2[];
    separation: number;
    isActive: boolean;
    isSensor: boolean;
}

export type CollisionEventType = 'collisionStart' | 'collisionActive' | 'collisionEnd';

export interface CollisionCallback {
    (event: CollisionEvent, type: CollisionEventType): void;
}

export class CollisionManager {
    private collisionCallbacks = new Map<string, CollisionCallback[]>();
    private entityCallbacks = new Map<string, CollisionCallback[]>();
    private globalCallbacks: CollisionCallback[] = []; private activeCollisions = new Map<string, CollisionEvent>();
    private isInitialized = false;
    public enableLogging = false; // Set to true to enable collision logging

    constructor() {
        // Don't setup collision events in constructor to avoid circular dependency
        // Will be initialized later when PhysicsSystem calls initialize()
    }

    /**
     * Initialize the collision manager with the physics engine
     * This should be called after the PhysicsSystem is fully set up
     */
    initialize(engine: any): void {
        if (this.isInitialized) {
            console.warn('CollisionManager already initialized');
            return;
        }

        this.setupCollisionEvents(engine);
        this.isInitialized = true;
        console.log('✅ CollisionManager initialized');
    }

    private setupCollisionEvents(engine: any): void {
        // Collision start events
        Events.on(engine, 'collisionStart', (event: any) => {
            this.handleCollisionEvent(event, 'collisionStart');
        });

        // Collision active events (ongoing collisions)
        Events.on(engine, 'collisionActive', (event: any) => {
            this.handleCollisionEvent(event, 'collisionActive');
        });

        // Collision end events
        Events.on(engine, 'collisionEnd', (event: any) => {
            this.handleCollisionEvent(event, 'collisionEnd');
        });
    }

    private handleCollisionEvent(event: any, type: CollisionEventType): void {
        const pairs = event.pairs.map((pair: any) => this.createCollisionPair(pair));
        // Removed excessive logging for performance

        for (const pair of event.pairs) {
            const entityA = this.getEntityFromBody(pair.bodyA);
            const entityB = this.getEntityFromBody(pair.bodyB);

            if (entityA && entityB) {
                const collisionEvent: CollisionEvent = {
                    entityA,
                    entityB,
                    bodyA: pair.bodyA,
                    bodyB: pair.bodyB,
                    pairs,
                    timestamp: Date.now()
                };

                const collisionKey = this.getCollisionKey(entityA, entityB);

                // Track active collisions
                if (type === 'collisionStart') {
                    this.activeCollisions.set(collisionKey, collisionEvent);
                    this.updateGameStoreCollisions('add', collisionEvent);
                } else if (type === 'collisionEnd') {
                    this.activeCollisions.delete(collisionKey);
                    this.updateGameStoreCollisions('remove', collisionEvent);
                }                // Trigger callbacks
                if (this.enableLogging) {
                    console.log(`🔔 Triggering callbacks for ${type}`);
                }
                this.triggerCallbacks(collisionEvent, type);
            } else {
                if (this.enableLogging) {
                    console.log(`❌ Skipping collision - invalid entities: entityA="${entityA}", entityB="${entityB}"`);
                }
            }
        }
    }

    private createCollisionPair(pair: any): CollisionPair {
        return {
            bodyA: pair.bodyA,
            bodyB: pair.bodyB,
            contactPoints: pair.contacts?.map((contact: any) => ({
                x: contact.vertex.x,
                y: contact.vertex.y
            })) || [],
            separation: pair.separation || 0,
            isActive: pair.isActive || false,
            isSensor: pair.bodyA.isSensor || pair.bodyB.isSensor
        };
    }

    private getEntityFromBody(body: Body): string | null {
        // Extract entity ID from body label
        const label = body.label;
        return label;
    }

    private getCollisionKey(entityA: string, entityB: string): string {
        // Create a consistent key for collision pairs
        return entityA < entityB ? `${entityA}-${entityB}` : `${entityB}-${entityA}`;
    }

    private updateGameStoreCollisions(action: 'add' | 'remove', event: CollisionEvent): void {
        const store = useGameStore.getState();

        if (action === 'add') {
            store.addCollision({
                id: this.getCollisionKey(event.entityA, event.entityB),
                entityA: event.entityA,
                entityB: event.entityB,
                timestamp: event.timestamp,
                isActive: true
            });
        } else {
            store.removeCollision(this.getCollisionKey(event.entityA, event.entityB));
        }
    } private triggerCallbacks(event: CollisionEvent, type: CollisionEventType): void {
        if (this.enableLogging) {
            console.log(`🔔 Triggering callbacks for ${type}: ${event.entityA} <-> ${event.entityB}`);
            console.log(`📊 Registered callbacks - Global: ${this.globalCallbacks.length}, Type: ${this.collisionCallbacks.get(type)?.length || 0}`);
        }

        // Global callbacks
        this.globalCallbacks.forEach(callback => {
            try {
                if (this.enableLogging) {
                    console.log(`🌐 Calling global callback for ${type}`);
                }
                callback(event, type);
            } catch (error) {
                console.error('Error in global collision callback:', error);
            }
        });

        // Entity-specific callbacks
        const entityACallbacks = this.entityCallbacks.get(event.entityA) || [];
        const entityBCallbacks = this.entityCallbacks.get(event.entityB) || [];

        [...entityACallbacks, ...entityBCallbacks].forEach(callback => {
            try {
                if (this.enableLogging) {
                    console.log(`🎯 Calling entity callback for ${type}`);
                }
                callback(event, type);
            } catch (error) {
                console.error('Error in entity collision callback:', error);
            }
        });

        // Type-specific callbacks
        const typeCallbacks = this.collisionCallbacks.get(type) || [];
        typeCallbacks.forEach(callback => {
            try {
                if (this.enableLogging) {
                    console.log(`📝 Calling type-specific callback for ${type}`);
                }
                callback(event, type);
            } catch (error) {
                console.error('Error in type collision callback:', error);
            }
        });
    }

    // Public API methods

    /**
     * Register a callback for all collision events
     */
    onCollision(callback: CollisionCallback): () => void {
        this.globalCallbacks.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.globalCallbacks.indexOf(callback);
            if (index > -1) {
                this.globalCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Register a callback for specific collision event types
     */
    onCollisionType(type: CollisionEventType, callback: CollisionCallback): () => void {
        if (!this.collisionCallbacks.has(type)) {
            this.collisionCallbacks.set(type, []);
        }
        this.collisionCallbacks.get(type)!.push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.collisionCallbacks.get(type);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    /**
     * Register a callback for collisions involving a specific entity
     */
    onEntityCollision(entityId: string, callback: CollisionCallback): () => void {
        if (!this.entityCallbacks.has(entityId)) {
            this.entityCallbacks.set(entityId, []);
        }
        this.entityCallbacks.get(entityId)!.push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.entityCallbacks.get(entityId);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    /**
     * Get all currently active collisions
     */
    getActiveCollisions(): CollisionEvent[] {
        return Array.from(this.activeCollisions.values());
    }

    /**
     * Check if two entities are currently colliding
     */
    areEntitiesColliding(entityA: string, entityB: string): boolean {
        const key = this.getCollisionKey(entityA, entityB);
        return this.activeCollisions.has(key);
    }

    /**
     * Get collision details between two entities if they are colliding
     */
    getCollisionBetween(entityA: string, entityB: string): CollisionEvent | null {
        const key = this.getCollisionKey(entityA, entityB);
        return this.activeCollisions.get(key) || null;
    }

    /**
     * Clear all callbacks and active collisions
     */
    cleanup(): void {
        this.collisionCallbacks.clear();
        this.entityCallbacks.clear();
        this.globalCallbacks.length = 0;
        this.activeCollisions.clear();
    }

    /**
     * Get collision statistics
     */
    getCollisionStats(): {
        activeCollisions: number;
        totalCallbacks: number;
        entityCallbacks: number;
        typeCallbacks: number;
    } {
        let totalTypeCallbacks = 0;
        this.collisionCallbacks.forEach(callbacks => {
            totalTypeCallbacks += callbacks.length;
        });

        let totalEntityCallbacks = 0;
        this.entityCallbacks.forEach(callbacks => {
            totalEntityCallbacks += callbacks.length;
        });

        return {
            activeCollisions: this.activeCollisions.size,
            totalCallbacks: this.globalCallbacks.length + totalTypeCallbacks + totalEntityCallbacks,
            entityCallbacks: totalEntityCallbacks,
            typeCallbacks: totalTypeCallbacks
        };
    }
}

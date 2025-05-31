import { Body, Bodies } from 'matter-js';
import { IComponent, Vector2 } from '@/core/types';

/**
 * Configuration options for creating a rigid body in the physics simulation.
 * These options control the physical properties and behavior of the rigid body. 🏗️
 */
export interface RigidBodyOptions {
    /** Whether the rigid body is static (immovable) or dynamic. Defaults to false for dynamic bodies. 🏔️ */
    isStatic?: boolean;

    /** Whether the rigid body acts as a sensor (no collision response, only collision detection). 👁️ */
    isSensor?: boolean;

    /** The density of the rigid body, affecting its mass when combined with area. Higher values create heavier objects. ⚖️ */
    density?: number;

    /** The friction coefficient between this body and other bodies during contact. Range: 0 (no friction) to 1 (high friction). 🤝 */
    friction?: number;

    /** Air resistance applied to the body, slowing down movement over time. Higher values create more drag. 💨 */
    frictionAir?: number;

    /** The restitution (bounciness) of the body during collisions. Range: 0 (no bounce) to 1 (perfect bounce). 🏀 */
    restitution?: number;

    /** The mass of the rigid body. If not specified, it will be calculated from density and area. 📏 */
    mass?: number;

    /** The initial rotation angle of the body in radians. 🔄 */
    angle?: number;

    /** The initial angular velocity (rotation speed) of the body in radians per second. 🌪️ */
    angularVelocity?: number;

    /** The initial linear velocity of the body as a 2D vector. 🚀 */
    velocity?: Vector2;

    /** A string identifier for the rigid body, useful for debugging and identification. 🏷️ */
    label?: string;

    /** Collision filtering options to control which bodies can collide with each other. 🚧 */
    collisionFilter?: {
        /** The collision category bitmask that this body belongs to. 📦 */
        category?: number;

        /** The collision mask bitmask that determines which categories this body can collide with. 🎭 */
        mask?: number;

        /** The collision group. Bodies with the same positive group always collide, same negative group never collide. 👥 */
        group?: number;
    };
}

export interface CollisionShape {
    type: 'rectangle' | 'circle' | 'polygon';
    width?: number;
    height?: number;
    radius?: number;
    vertices?: Vector2[];
}

export class RigidBodyComponent implements IComponent {
    public readonly type = 'rigidbody';
    public readonly entityId: string;
    public body: Body;
    public shape: CollisionShape;
    public options: RigidBodyOptions;

    constructor(
        entityId: string,
        position: Vector2,
        shape: CollisionShape,
        options: RigidBodyOptions = {}
    ) {
        this.entityId = entityId;
        this.shape = shape;
        this.options = options;

        // Create the physics body based on shape
        this.body = this.createBody(position, shape, options);

        // Set the label for identification
        this.body.label = options.label || `Entity_${entityId}`;

        // Apply additional options
        this.applyOptions(options);
    }

    private createBody(position: Vector2, shape: CollisionShape, options: RigidBodyOptions): Body {
        let body: Body;

        switch (shape.type) {
            case 'rectangle':
                if (!shape.width || !shape.height) {
                    throw new Error('Rectangle shape requires width and height');
                }
                body = Bodies.rectangle(
                    position.x,
                    position.y,
                    shape.width,
                    shape.height,
                    options
                );
                break;

            case 'circle':
                if (!shape.radius) {
                    throw new Error('Circle shape requires radius');
                }
                body = Bodies.circle(
                    position.x,
                    position.y,
                    shape.radius,
                    options
                );
                break;

            case 'polygon':
                if (!shape.vertices || shape.vertices.length < 3) {
                    throw new Error('Polygon shape requires at least 3 vertices');
                }
                body = Bodies.fromVertices(
                    position.x,
                    position.y,
                    [shape.vertices],
                    options
                );
                break;

            default:
                throw new Error(`Unsupported shape type: ${(shape as any).type}`);
        }

        return body;
    }

    private applyOptions(options: RigidBodyOptions): void {
        if (options.isStatic !== undefined) {
            Body.setStatic(this.body, options.isStatic);
        }

        if (options.isSensor !== undefined) {
            this.body.isSensor = options.isSensor;
        }

        if (options.angle !== undefined) {
            Body.setAngle(this.body, options.angle);
        }

        if (options.angularVelocity !== undefined) {
            Body.setAngularVelocity(this.body, options.angularVelocity);
        }

        if (options.velocity !== undefined) {
            Body.setVelocity(this.body, options.velocity);
        }

        if (options.mass !== undefined) {
            Body.setMass(this.body, options.mass);
        }

        if (options.density !== undefined) {
            Body.setDensity(this.body, options.density);
        }

        if (options.friction !== undefined) {
            this.body.friction = options.friction;
        }

        if (options.frictionAir !== undefined) {
            this.body.frictionAir = options.frictionAir;
        }

        if (options.restitution !== undefined) {
            this.body.restitution = options.restitution;
        }

        if (options.collisionFilter !== undefined) {
            this.body.collisionFilter = {
                ...this.body.collisionFilter,
                ...options.collisionFilter
            };
        }
    }

    // Convenience methods
    setStatic(isStatic: boolean): void {
        this.options.isStatic = isStatic;
        Body.setStatic(this.body, isStatic);
    }

    setSensor(isSensor: boolean): void {
        this.options.isSensor = isSensor;
        this.body.isSensor = isSensor;
    }

    setVelocity(velocity: Vector2): void {
        this.options.velocity = velocity;
        Body.setVelocity(this.body, velocity);
    }

    applyForce(force: Vector2, point?: Vector2): void {
        const forcePoint = point || this.body.position;
        Body.applyForce(this.body, forcePoint, force);
    }

    setPosition(position: Vector2): void {
        Body.setPosition(this.body, position);
    }

    setRotation(angle: number): void {
        this.options.angle = angle;
        Body.setAngle(this.body, angle);
    }

    setMass(mass: number): void {
        this.options.mass = mass;
        Body.setMass(this.body, mass);
    }

    setDensity(density: number): void {
        this.options.density = density;
        Body.setDensity(this.body, density);
    }

    setFriction(friction: number): void {
        this.options.friction = friction;
        this.body.friction = friction;
    }

    setRestitution(restitution: number): void {
        this.options.restitution = restitution;
        this.body.restitution = restitution;
    }

    getPosition(): Vector2 {
        return { x: this.body.position.x, y: this.body.position.y };
    }

    getVelocity(): Vector2 {
        return { x: this.body.velocity.x, y: this.body.velocity.y };
    }

    getRotation(): number {
        return this.body.angle;
    }

    getMass(): number {
        return this.body.mass;
    }

    getArea(): number {
        return this.body.area;
    }

    getBounds(): { min: Vector2; max: Vector2 } {
        return {
            min: { x: this.body.bounds.min.x, y: this.body.bounds.min.y },
            max: { x: this.body.bounds.max.x, y: this.body.bounds.max.y }
        };
    }
}

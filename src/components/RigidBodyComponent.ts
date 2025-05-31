import { Body, Bodies } from 'matter-js';
import { IComponent, Vector2 } from '@/core/types';

export interface RigidBodyOptions {
    isStatic?: boolean;
    isSensor?: boolean;
    density?: number;
    friction?: number;
    frictionAir?: number;
    restitution?: number;
    mass?: number;
    angle?: number;
    angularVelocity?: number;
    velocity?: Vector2;
    label?: string;
    collisionFilter?: {
        category?: number;
        mask?: number;
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


        console.log(`RigidBodyComponent created for entity ${entityId} with shape ${JSON.stringify(shape)}`);
        console.log(`RigidBodyComponent created for entity ${entityId} with label ${this.body.label}`);

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

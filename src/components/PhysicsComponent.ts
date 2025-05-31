import { Body } from 'matter-js';
import { IComponent } from '@/core/types';

export class PhysicsComponent implements IComponent {
    public readonly type = 'physics';
    public readonly entityId: string;
    public body: Body;
    public isSensor: boolean = false;
    public isStatic: boolean = false;

    constructor(entityId: string, body: Body) {
        this.entityId = entityId;
        this.body = body;
        this.body.label = `Entity_${entityId}`;
    }

    setStatic(isStatic: boolean): void {
        this.isStatic = isStatic;
        Body.setStatic(this.body, isStatic);
    }

    setSensor(isSensor: boolean): void {
        this.isSensor = isSensor;
        this.body.isSensor = isSensor;
    }

    setVelocity(x: number, y: number): void {
        Body.setVelocity(this.body, { x, y });
    }

    applyForce(x: number, y: number): void {
        Body.applyForce(this.body, this.body.position, { x, y });
    }

    setPosition(x: number, y: number): void {
        Body.setPosition(this.body, { x, y });
    }

    setRotation(angle: number): void {
        Body.setAngle(this.body, angle);
    }

    setMass(mass: number): void {
        Body.setMass(this.body, mass);
    }

    setDensity(density: number): void {
        Body.setDensity(this.body, density);
    }

    setFriction(friction: number): void {
        this.body.friction = friction;
    }

    setRestitution(restitution: number): void {
        this.body.restitution = restitution;
    }
}

import { IComponent, Vector2 } from '@/core/types';

export class TransformComponent implements IComponent {
    public readonly type = 'transform';
    public readonly entityId: string;

    public position: Vector2;
    public rotation: number;
    public scale: Vector2;

    constructor(entityId: string, position: Vector2 = { x: 0, y: 0 }) {
        this.entityId = entityId;
        this.position = position;
        this.rotation = 0;
        this.scale = { x: 1, y: 1 };
    }

    setPosition(x: number, y: number): void {
        this.position.x = x;
        this.position.y = y;
    }

    setRotation(rotation: number): void {
        this.rotation = rotation;
    }

    setScale(x: number, y: number): void {
        this.scale.x = x;
        this.scale.y = y;
    }
}

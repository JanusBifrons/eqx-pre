import { Container } from 'pixi.js';
import { IEntity, IComponent } from '@/core/types';

export class Entity implements IEntity {
    public readonly id: string;
    public readonly container: Container;
    private components = new Map<string, IComponent>();

    constructor(id: string) {
        this.id = id;
        this.container = new Container();
        this.container.name = `Entity_${id}`;
    }

    addComponent<T extends IComponent>(component: T): void {
        if (this.components.has(component.type)) {
            console.warn(`Component '${component.type}' already exists on entity '${this.id}'`);
            return;
        }
        this.components.set(component.type, component);
    }

    removeComponent(type: string): void {
        this.components.delete(type);
    }

    getComponent<T extends IComponent>(type: string): T | undefined {
        return this.components.get(type) as T;
    }

    hasComponent(type: string): boolean {
        return this.components.has(type);
    }

    getAllComponents(): IComponent[] {
        return Array.from(this.components.values());
    }

    destroy(): void {
        // Remove all components
        this.components.clear();

        // Remove from parent container
        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }

        // Destroy the PIXI container
        this.container.destroy({
            children: true,
            texture: false,
            baseTexture: false,
        });
    }
}

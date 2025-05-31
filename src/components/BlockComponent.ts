import { IComponent } from '@/core/types';
import { BlockDefinition, BlockProperties, BlockType } from '@/entities/Block';

export class BlockComponent implements IComponent {
    public readonly type = 'block';
    public readonly entityId: string;
    public definition: BlockDefinition;
    public properties: BlockProperties;
    public health: number;
    public isActive: boolean = true;

    // State tracking
    public temperature: number = 0;
    public powerConsumption: number = 0;
    public powerOutput: number = 0;

    constructor(entityId: string, definition: BlockDefinition, properties: BlockProperties = {}) {
        this.entityId = entityId;
        this.definition = definition;
        this.properties = properties;
        this.health = definition.maxHealth;
    }

    public takeDamage(amount: number): void {
        this.health = Math.max(0, this.health - amount);

        if (this.health === 0) {
            this.isActive = false;
        }
    }

    public repair(amount: number): void {
        this.health = Math.min(this.definition.maxHealth, this.health + amount);

        if (this.health > 0) {
            this.isActive = true;
        }
    }

    public getHealthPercentage(): number {
        return this.health / this.definition.maxHealth;
    }

    public isDestroyed(): boolean {
        return this.health <= 0;
    }

    public canOperate(): boolean {
        return this.isActive && this.health > 0;
    }

    // Block type specific methods
    public getThrust(): number {
        if (this.definition.type === BlockType.ENGINE && this.canOperate()) {
            return this.properties.thrust || 0;
        }
        return 0;
    }

    public getDamage(): number {
        if (this.definition.type === BlockType.WEAPON && this.canOperate()) {
            return this.properties.damage || 0;
        }
        return 0;
    }

    public getArmor(): number {
        if (this.definition.type === BlockType.HULL) {
            return (this.properties.armor || 0) * this.getHealthPercentage();
        }
        return 0;
    }

    public update(deltaTime: number): void {
        // Update temperature based on activity
        if (this.isActive) {
            this.temperature += deltaTime * 0.1;
        } else {
            this.temperature = Math.max(0, this.temperature - deltaTime * 0.05);
        }

        // Clamp temperature
        this.temperature = Math.min(100, this.temperature);
    }
}

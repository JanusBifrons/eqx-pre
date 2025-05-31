import { Entity } from './Entity';
import { PhysicsComponent } from '@/components/PhysicsComponent';
import { RenderComponent } from '@/components/RenderComponent';
import { TransformComponent } from '@/components/TransformComponent';
import { BlockComponent } from '@/components/BlockComponent';
import { Bodies, Body, Vector } from 'matter-js';
import { Graphics } from 'pixi.js';

export enum BlockType {
    HULL = 'hull',
    ENGINE = 'engine',
    WEAPON = 'weapon',
    UTILITY = 'utility'
}

export interface BlockDefinition {
    type: BlockType;
    width: number;
    height: number;
    mass: number;
    maxHealth: number;
    color: number;
    connectionPoints: Vector[];  // Local connection points
    shape: 'rectangle' | 'circle' | 'polygon';
    vertices?: Vector[];  // For polygon shapes
}

export interface BlockProperties {
    // Engine specific
    thrust?: number;
    fuelConsumption?: number;

    // Weapon specific
    damage?: number;
    fireRate?: number;
    range?: number;

    // Hull specific
    armor?: number;

    // Utility specific
    utilityType?: string;
    capacity?: number;
}

export class Block extends Entity {
    public definition: BlockDefinition;
    public properties: BlockProperties;
    public gridPosition: Vector;
    public rotation: number = 0;
    public connections: Map<string, Block> = new Map(); // Connection point ID -> Connected block

    constructor(definition: BlockDefinition, properties: BlockProperties = {}, gridPosition: Vector = { x: 0, y: 0 }) {
        super();

        this.definition = definition;
        this.properties = properties;
        this.gridPosition = gridPosition;

        this.initializeComponents();
    } private initializeComponents(): void {
        // Create physics body
        const body = this.createPhysicsBody();
        const physicsComponent = new PhysicsComponent(this.id, body);
        this.addComponent(physicsComponent);

        // Create visual representation
        const graphics = this.createGraphics();
        const renderComponent = new RenderComponent(this.id, graphics);
        this.addComponent(renderComponent);

        // Add the graphics to the entity container
        this.container.addChild(graphics);

        // Create transform component
        const transformComponent = new TransformComponent(this.id);
        this.addComponent(transformComponent);

        // Create block-specific component
        const blockComponent = new BlockComponent(this.id, this.definition, this.properties);
        this.addComponent(blockComponent);
    }

    private createPhysicsBody(): Body {
        const { width, height, mass } = this.definition;

        let body: Body;

        switch (this.definition.shape) {
            case 'circle':
                body = Bodies.circle(0, 0, width / 2, { mass });
                break;
            case 'polygon':
                if (this.definition.vertices) {
                    body = Bodies.fromVertices(0, 0, [this.definition.vertices], { mass });
                } else {
                    body = Bodies.rectangle(0, 0, width, height, { mass });
                }
                break;
            case 'rectangle':
            default:
                body = Bodies.rectangle(0, 0, width, height, { mass });
                break;
        }

        body.label = `Block_${this.definition.type}_${this.id}`;
        return body;
    }

    private createGraphics(): Graphics {
        const graphics = new Graphics();
        const { width, height, color } = this.definition;

        graphics.beginFill(color, 0.8);
        graphics.lineStyle(2, 0xFFFFFF, 0.8);

        switch (this.definition.shape) {
            case 'circle':
                graphics.drawCircle(0, 0, width / 2);
                break;
            case 'polygon':
                if (this.definition.vertices) {
                    graphics.moveTo(this.definition.vertices[0].x, this.definition.vertices[0].y);
                    for (let i = 1; i < this.definition.vertices.length; i++) {
                        graphics.lineTo(this.definition.vertices[i].x, this.definition.vertices[i].y);
                    }
                    graphics.closePath();
                } else {
                    graphics.drawRect(-width / 2, -height / 2, width, height);
                }
                break;
            case 'rectangle':
            default:
                graphics.drawRect(-width / 2, -height / 2, width, height);
                break;
        }

        graphics.endFill();

        // Draw connection points
        this.drawConnectionPoints(graphics);

        // Draw type indicator
        this.drawTypeIndicator(graphics);

        return graphics;
    }

    private drawConnectionPoints(graphics: Graphics): void {
        graphics.beginFill(0x00FF00, 0.7);

        this.definition.connectionPoints.forEach(point => {
            graphics.drawCircle(point.x, point.y, 3);
        });

        graphics.endFill();
    }

    private drawTypeIndicator(graphics: Graphics): void {
        graphics.beginFill(0x000000, 0.8);

        const iconSize = 8;
        const x = 0;
        const y = 0;

        switch (this.definition.type) {
            case BlockType.ENGINE:
                // Draw triangle for engine
                graphics.moveTo(x - iconSize / 2, y + iconSize / 2);
                graphics.lineTo(x + iconSize / 2, y + iconSize / 2);
                graphics.lineTo(x, y - iconSize / 2);
                graphics.closePath();
                break;
            case BlockType.WEAPON:
                // Draw cross for weapon
                graphics.drawRect(x - iconSize / 2, y - 1, iconSize, 2);
                graphics.drawRect(x - 1, y - iconSize / 2, 2, iconSize);
                break;
            case BlockType.HULL:
                // Draw square for hull
                graphics.drawRect(x - iconSize / 3, y - iconSize / 3, iconSize * 2 / 3, iconSize * 2 / 3);
                break;
            case BlockType.UTILITY:
                // Draw diamond for utility
                graphics.moveTo(x, y - iconSize / 2);
                graphics.lineTo(x + iconSize / 2, y);
                graphics.lineTo(x, y + iconSize / 2);
                graphics.lineTo(x - iconSize / 2, y);
                graphics.closePath();
                break;
        }

        graphics.endFill();
    }

    public getConnectionPoint(index: number): Vector | null {
        if (index >= 0 && index < this.definition.connectionPoints.length) {
            const localPoint = this.definition.connectionPoints[index];
            // Transform to world coordinates
            const cos = Math.cos(this.rotation);
            const sin = Math.sin(this.rotation);

            return {
                x: this.gridPosition.x + (localPoint.x * cos - localPoint.y * sin),
                y: this.gridPosition.y + (localPoint.x * sin + localPoint.y * cos)
            };
        }
        return null;
    }

    public getAvailableConnectionPoints(): number[] {
        const available: number[] = [];

        for (let i = 0; i < this.definition.connectionPoints.length; i++) {
            if (!this.connections.has(i.toString())) {
                available.push(i);
            }
        }

        return available;
    }

    public connectTo(otherBlock: Block, myConnectionPoint: number, otherConnectionPoint: number): boolean {
        const myPointId = myConnectionPoint.toString();
        const otherPointId = otherConnectionPoint.toString();

        // Check if connection points are available
        if (this.connections.has(myPointId) || otherBlock.connections.has(otherPointId)) {
            return false;
        }

        // Establish bidirectional connection
        this.connections.set(myPointId, otherBlock);
        otherBlock.connections.set(otherPointId, this);

        return true;
    }

    public disconnect(connectionPoint: number): void {
        const pointId = connectionPoint.toString();
        const connectedBlock = this.connections.get(pointId);

        if (connectedBlock) {
            // Find and remove reverse connection
            for (const [otherPointId, block] of connectedBlock.connections) {
                if (block === this) {
                    connectedBlock.connections.delete(otherPointId);
                    break;
                }
            }

            // Remove our connection
            this.connections.delete(pointId);
        }
    }

    public setGridPosition(position: Vector): void {
        this.gridPosition = { ...position };

        // Update physics body position
        const physicsComponent = this.getComponent<PhysicsComponent>('physics');
        if (physicsComponent) {
            Body.setPosition(physicsComponent.body, position);
        }

        // Update transform component
        const transformComponent = this.getComponent<TransformComponent>('transform');
        if (transformComponent) {
            transformComponent.position.x = position.x;
            transformComponent.position.y = position.y;
        }
    }

    public setRotation(rotation: number): void {
        this.rotation = rotation;

        // Update physics body rotation
        const physicsComponent = this.getComponent<PhysicsComponent>('physics');
        if (physicsComponent) {
            Body.setAngle(physicsComponent.body, rotation);
        }

        // Update transform component
        const transformComponent = this.getComponent<TransformComponent>('transform');
        if (transformComponent) {
            transformComponent.rotation = rotation;
        }
    }

    public getConnectedBlocks(): Block[] {
        return Array.from(this.connections.values());
    }

    public isConnectedTo(block: Block): boolean {
        return Array.from(this.connections.values()).includes(block);
    }
}

import { Entity } from './Entity';
import { Block, BlockType } from './Block';
import { PhysicsComponent } from '@/components/PhysicsComponent';
import { ShipComponent } from '@/components/ShipComponent';
import { Bodies, Body, Composite, Constraint, Vector } from 'matter-js';

export interface ShipStats {
    totalMass: number;
    centerOfMass: Vector;
    totalThrust: number;
    totalArmor: number;
    totalWeapons: number;
    blockCount: number;
}

export class Ship extends Entity {
    public blocks: Map<string, Block> = new Map();
    public constraints: Constraint[] = [];
    public compound: Composite;
    private _stats: ShipStats | null = null;

    constructor() {
        super();
        this.compound = Composite.create();
        this.initializeComponents();
    }

    private initializeComponents(): void {
        // Create ship-specific component
        const shipComponent = new ShipComponent(this.id);
        this.addComponent(shipComponent);
    }

    public addBlock(block: Block, position?: Vector): void {
        if (position) {
            block.setGridPosition(position);
        }

        this.blocks.set(block.id, block);

        // Add block's physics body to compound
        const blockPhysics = block.getComponent<PhysicsComponent>('physics');
        if (blockPhysics) {
            Composite.add(this.compound, blockPhysics.body);
        }

        // Invalidate cached stats
        this._stats = null;
    }

    public removeBlock(blockId: string): boolean {
        const block = this.blocks.get(blockId);
        if (!block) return false;

        // Disconnect all connections
        const connectedBlocks = block.getConnectedBlocks();
        connectedBlocks.forEach(connectedBlock => {
            this.disconnectBlocks(block, connectedBlock);
        });

        // Remove from compound
        const blockPhysics = block.getComponent<PhysicsComponent>('physics');
        if (blockPhysics) {
            Composite.remove(this.compound, blockPhysics.body);
        }

        // Remove from ship
        this.blocks.delete(blockId);

        // Invalidate cached stats
        this._stats = null;

        return true;
    }

    public connectBlocks(
        block1: Block,
        block2: Block,
        connectionPoint1: number,
        connectionPoint2: number,
        constraintOptions: any = {}
    ): boolean {
        // Establish logical connection
        if (!block1.connectTo(block2, connectionPoint1, connectionPoint2)) {
            return false;
        }

        // Create physical constraint
        const point1 = block1.getConnectionPoint(connectionPoint1);
        const point2 = block2.getConnectionPoint(connectionPoint2);

        if (!point1 || !point2) {
            block1.disconnect(connectionPoint1);
            return false;
        }

        const physics1 = block1.getComponent<PhysicsComponent>('physics');
        const physics2 = block2.getComponent<PhysicsComponent>('physics');

        if (!physics1 || !physics2) {
            block1.disconnect(connectionPoint1);
            return false;
        }

        // Convert world points to local body coordinates
        const localPoint1 = Vector.sub(point1, physics1.body.position);
        const localPoint2 = Vector.sub(point2, physics2.body.position);

        const constraint = Constraint.create({
            bodyA: physics1.body,
            bodyB: physics2.body,
            pointA: localPoint1,
            pointB: localPoint2,
            stiffness: 1,
            damping: 0.1,
            length: 0,
            ...constraintOptions
        });

        this.constraints.push(constraint);
        Composite.add(this.compound, constraint);

        // Invalidate cached stats
        this._stats = null;

        return true;
    }

    public disconnectBlocks(block1: Block, block2: Block): void {
        // Find and remove constraint
        const physics1 = block1.getComponent<PhysicsComponent>('physics');
        const physics2 = block2.getComponent<PhysicsComponent>('physics');

        if (physics1 && physics2) {
            const constraintIndex = this.constraints.findIndex(constraint =>
                (constraint.bodyA === physics1.body && constraint.bodyB === physics2.body) ||
                (constraint.bodyA === physics2.body && constraint.bodyB === physics1.body)
            );

            if (constraintIndex !== -1) {
                const constraint = this.constraints[constraintIndex];
                Composite.remove(this.compound, constraint);
                this.constraints.splice(constraintIndex, 1);
            }
        }

        // Remove logical connections
        for (const [pointId, connectedBlock] of block1.connections) {
            if (connectedBlock === block2) {
                block1.disconnect(parseInt(pointId));
                break;
            }
        }

        // Invalidate cached stats
        this._stats = null;
    }

    public calculateStats(): ShipStats {
        if (this._stats) {
            return this._stats;
        }

        let totalMass = 0;
        let weightedX = 0;
        let weightedY = 0;
        let totalThrust = 0;
        let totalArmor = 0;
        let totalWeapons = 0;

        for (const block of this.blocks.values()) {
            const blockMass = block.definition.mass;
            totalMass += blockMass;

            weightedX += block.gridPosition.x * blockMass;
            weightedY += block.gridPosition.y * blockMass;

            // Sum up capabilities
            if (block.definition.type === BlockType.ENGINE && block.properties.thrust) {
                totalThrust += block.properties.thrust;
            }

            if (block.definition.type === BlockType.HULL && block.properties.armor) {
                totalArmor += block.properties.armor;
            }

            if (block.definition.type === BlockType.WEAPON) {
                totalWeapons++;
            }
        }

        const centerOfMass: Vector = totalMass > 0
            ? { x: weightedX / totalMass, y: weightedY / totalMass }
            : { x: 0, y: 0 };

        this._stats = {
            totalMass,
            centerOfMass,
            totalThrust,
            totalArmor,
            totalWeapons,
            blockCount: this.blocks.size
        };

        return this._stats;
    }

    public updateCenterOfMass(): void {
        const stats = this.calculateStats();

        // Update the compound's center of mass
        // Note: Matter.js will automatically calculate this, but we can use it for gameplay logic
        const shipComponent = this.getComponent<ShipComponent>('ship');
        if (shipComponent) {
            shipComponent.centerOfMass = stats.centerOfMass;
        }
    }

    public getBlocksOfType(type: BlockType): Block[] {
        return Array.from(this.blocks.values()).filter(block => block.definition.type === type);
    }

    public getConnectedBlocks(startBlock: Block): Set<Block> {
        const visited = new Set<Block>();
        const queue = [startBlock];

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current)) continue;

            visited.add(current);

            const connected = current.getConnectedBlocks();
            for (const block of connected) {
                if (!visited.has(block)) {
                    queue.push(block);
                }
            }
        }

        return visited;
    }

    public validateStructuralIntegrity(): { isValid: boolean; issues: string[] } {
        const issues: string[] = [];

        if (this.blocks.size === 0) {
            return { isValid: false, issues: ['Ship has no blocks'] };
        }

        // Check if all blocks are connected
        const firstBlock = Array.from(this.blocks.values())[0];
        const connectedBlocks = this.getConnectedBlocks(firstBlock);

        if (connectedBlocks.size !== this.blocks.size) {
            issues.push(`${this.blocks.size - connectedBlocks.size} blocks are not connected to the main structure`);
        }

        // Check for required block types
        const hullBlocks = this.getBlocksOfType(BlockType.HULL);
        if (hullBlocks.length === 0) {
            issues.push('Ship must have at least one hull block');
        }

        const engineBlocks = this.getBlocksOfType(BlockType.ENGINE);
        if (engineBlocks.length === 0) {
            issues.push('Ship must have at least one engine block');
        }

        return {
            isValid: issues.length === 0,
            issues
        };
    }

    public createCompoundPhysicsBody(): Body {
        const bodies: Body[] = [];

        for (const block of this.blocks.values()) {
            const physics = block.getComponent<PhysicsComponent>('physics');
            if (physics) {
                bodies.push(physics.body);
            }
        }

        if (bodies.length === 0) {
            // Create a dummy body if no blocks
            return Bodies.rectangle(0, 0, 1, 1, { mass: 0.1 });
        }

        // Create compound body
        const compound = Body.create({
            parts: bodies,
            frictionAir: 0.01,
            friction: 0.8
        });

        // Add physics component to ship
        const shipPhysics = new PhysicsComponent(this.id, compound);
        this.addComponent(shipPhysics);

        return compound;
    }

    public applyThrust(direction: Vector, throttle: number = 1): void {
        const engineBlocks = this.getBlocksOfType(BlockType.ENGINE);
        const shipPhysics = this.getComponent<PhysicsComponent>('physics');

        if (!shipPhysics || engineBlocks.length === 0) return;

        let totalThrust = 0;
        for (const engine of engineBlocks) {
            if (engine.properties.thrust) {
                totalThrust += engine.properties.thrust;
            }
        }

        const force = Vector.mult(Vector.normalise(direction), totalThrust * throttle);
        Body.applyForce(shipPhysics.body, shipPhysics.body.position, force);
    }

    public destroy(): void {
        // Clean up constraints
        for (const constraint of this.constraints) {
            Composite.remove(this.compound, constraint);
        }
        this.constraints.length = 0;

        // Destroy all blocks
        for (const block of this.blocks.values()) {
            block.destroy();
        }
        this.blocks.clear();

        // Clear compound
        Composite.clear(this.compound, false);

        super.destroy();
    }
}

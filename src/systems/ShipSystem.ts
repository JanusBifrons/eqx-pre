import { ISystem } from '@/core/types';
import { Ship } from '@/entities/Ship';
import { Block } from '@/entities/Block';
import { ShipComponent } from '@/components/ShipComponent';
import { BlockComponent } from '@/components/BlockComponent';
import { PhysicsComponent } from '@/components/PhysicsComponent';
import { Engine, World, Body, Vector } from 'matter-js';

export class ShipSystem implements ISystem {
    public readonly name = 'ShipSystem';
    private physicsEngine: Engine;
    private ships: Set<Ship> = new Set(); constructor(physicsEngine: Engine) {
        this.physicsEngine = physicsEngine;
    }

    public registerShip(ship: Ship): void {
        this.ships.add(ship);
    }

    public unregisterShip(ship: Ship): void {
        this.ships.delete(ship);

        // Remove from physics world
        if (ship.compound) {
            World.remove(this.physicsEngine.world, ship.compound);
        }
    }

    public update(deltaTime: number): void {
        for (const ship of this.ships) {
            this.updateShip(ship, deltaTime);
        }
    }

    private updateShip(ship: Ship, deltaTime: number): void {
        const shipComponent = ship.getComponent<ShipComponent>('ship');
        if (!shipComponent) return;

        // Update ship component
        shipComponent.update(deltaTime);

        // Update all blocks
        for (const block of ship.blocks.values()) {
            const blockComponent = block.getComponent<BlockComponent>('block');
            if (blockComponent) {
                blockComponent.update(deltaTime);
            }
        }

        // Update physics if ship is constructed
        if (shipComponent.isConstructed) {
            this.updateShipPhysics(ship, deltaTime);
        }

        // Update ship stats
        this.updateShipStats(ship);
    }

    private updateShipPhysics(ship: Ship, _deltaTime: number): void {
        const shipPhysics = ship.getComponent<PhysicsComponent>('physics');
        if (!shipPhysics) return;

        // Apply drag
        const velocity = shipPhysics.body.velocity;
        const speed = Vector.magnitude(velocity);

        if (speed > 0.1) {
            const dragForce = Vector.mult(Vector.normalise(velocity), -speed * 0.01);
            Body.applyForce(shipPhysics.body, shipPhysics.body.position, dragForce);
        }

        // Update center of mass
        ship.updateCenterOfMass();

        // Validate structural integrity during physics simulation
        this.validateShipStructure(ship);
    }

    private updateShipStats(ship: Ship): void {
        const shipComponent = ship.getComponent<ShipComponent>('ship');
        if (!shipComponent) return;

        const stats = ship.calculateStats();

        // Update ship component properties based on blocks
        shipComponent.maxFuel = this.calculateMaxFuel(ship);
        shipComponent.maxPower = this.calculateMaxPower(ship);
        shipComponent.maxShield = this.calculateMaxShield(ship);
        shipComponent.armor = stats.totalArmor;

        // Calculate performance metrics
        const thrustToMassRatio = stats.totalMass > 0 ? stats.totalThrust / stats.totalMass : 0;
        shipComponent.acceleration = thrustToMassRatio;
        shipComponent.maxSpeed = Math.sqrt(thrustToMassRatio * 100); // Simplified calculation
        shipComponent.maneuverability = this.calculateManeuverability(ship);
    }

    private calculateMaxFuel(ship: Ship): number {
        let maxFuel = 0;

        for (const block of ship.blocks.values()) {
            const blockComponent = block.getComponent<BlockComponent>('block');
            if (blockComponent && block.properties.utilityType === 'reactor') {
                maxFuel += block.properties.capacity || 0;
            }
        }

        return Math.max(100, maxFuel); // Minimum base fuel
    }

    private calculateMaxPower(ship: Ship): number {
        let maxPower = 0;

        for (const block of ship.blocks.values()) {
            const blockComponent = block.getComponent<BlockComponent>('block');
            if (blockComponent && block.properties.utilityType === 'reactor') {
                maxPower += (block.properties.capacity || 0) * 2;
            }
        }

        return Math.max(100, maxPower); // Minimum base power
    }

    private calculateMaxShield(ship: Ship): number {
        let maxShield = 0;

        for (const block of ship.blocks.values()) {
            const blockComponent = block.getComponent<BlockComponent>('block');
            if (blockComponent && block.properties.utilityType === 'shield') {
                maxShield += block.properties.capacity || 0;
            }
        }

        return maxShield;
    }

    private calculateManeuverability(ship: Ship): number {
        const stats = ship.calculateStats();
        if (stats.totalMass === 0) return 0;

        // Calculate moment of inertia approximation
        let momentOfInertia = 0;

        for (const block of ship.blocks.values()) {
            const distanceFromCOM = Vector.magnitude(Vector.sub(block.gridPosition, stats.centerOfMass));
            momentOfInertia += block.definition.mass * Math.pow(distanceFromCOM, 2);
        }

        // Calculate maneuverability based on mass distribution
        return momentOfInertia > 0 ? 1000 / momentOfInertia : 1;
    }

    private validateShipStructure(ship: Ship): void {
        const validation = ship.validateStructuralIntegrity();

        if (!validation.isValid) {
            // Handle structural failure
            this.handleStructuralFailure(ship, validation.issues);
        }
    }

    private handleStructuralFailure(_ship: Ship, issues: string[]): void {
        console.warn('Ship structural failure:', issues);

        // Could implement breaking apart mechanics here
        // For now, just log the issues
    }

    public createShipFromBlocks(blocks: Block[]): Ship {
        const ship = new Ship();

        // Add all blocks to ship
        for (const block of blocks) {
            ship.addBlock(block);
        }

        // Auto-connect adjacent blocks
        this.autoConnectBlocks(ship);

        // Register with system
        this.registerShip(ship);

        return ship;
    }

    private autoConnectBlocks(ship: Ship): void {
        const blocks = Array.from(ship.blocks.values());
        const connectionRange = 50; // pixels

        for (let i = 0; i < blocks.length; i++) {
            for (let j = i + 1; j < blocks.length; j++) {
                const block1 = blocks[i];
                const block2 = blocks[j];

                const distance = Vector.magnitude(Vector.sub(block1.gridPosition, block2.gridPosition));

                if (distance <= connectionRange) {
                    // Find closest connection points
                    const connection = this.findBestConnection(block1, block2);

                    if (connection) {
                        ship.connectBlocks(block1, block2, connection.point1, connection.point2);
                    }
                }
            }
        }
    }

    private findBestConnection(block1: Block, block2: Block): { point1: number; point2: number } | null {
        const availablePoints1 = block1.getAvailableConnectionPoints();
        const availablePoints2 = block2.getAvailableConnectionPoints();

        let bestConnection: { point1: number; point2: number } | null = null;
        let shortestDistance = Infinity;

        for (const point1Index of availablePoints1) {
            const point1 = block1.getConnectionPoint(point1Index);
            if (!point1) continue;

            for (const point2Index of availablePoints2) {
                const point2 = block2.getConnectionPoint(point2Index);
                if (!point2) continue;

                const distance = Vector.magnitude(Vector.sub(point1, point2));

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    bestConnection = { point1: point1Index, point2: point2Index };
                }
            }
        }

        return bestConnection;
    }

    public applyThrustToShip(ship: Ship, direction: Vector, throttle: number = 1): void {
        ship.applyThrust(direction, throttle);

        // Consume fuel
        const shipComponent = ship.getComponent<ShipComponent>('ship');
        if (shipComponent) {
            const fuelConsumption = this.calculateFuelConsumption(ship, throttle);
            shipComponent.consumeFuel(fuelConsumption);
        }
    }

    private calculateFuelConsumption(ship: Ship, throttle: number): number {
        let totalConsumption = 0;

        for (const block of ship.blocks.values()) {
            if (block.definition.type === 'engine' && block.properties.fuelConsumption) {
                totalConsumption += block.properties.fuelConsumption * throttle;
            }
        }

        return totalConsumption * 0.016; // Per frame at 60fps
    }

    public getShipAtPosition(position: Vector): Ship | null {
        for (const ship of this.ships) {
            const shipPhysics = ship.getComponent<PhysicsComponent>('physics');
            if (!shipPhysics) continue;

            // Simple bounds check - could be more sophisticated
            const shipBounds = shipPhysics.body.bounds;
            if (position.x >= shipBounds.min.x && position.x <= shipBounds.max.x &&
                position.y >= shipBounds.min.y && position.y <= shipBounds.max.y) {
                return ship;
            }
        }

        return null;
    }

    public getShips(): Ship[] {
        return Array.from(this.ships);
    }

    public destroy(): void {
        // Clean up all ships
        for (const ship of this.ships) {
            this.unregisterShip(ship);
            ship.destroy();
        }
        this.ships.clear();
    }
}

import { Vector } from 'matter-js';
import { IBlockPlacer, IShipBuilderConfig } from '../interfaces/IUIComponent';
import { Ship } from '@/entities/Ship';
import { Block } from '@/entities/Block';
import { BlockDefinitions } from '@/entities/BlockDefinitions';

export class BlockPlacer implements IBlockPlacer {
    private ship: Ship;
    private config: IShipBuilderConfig;

    constructor(ship: Ship, config: IShipBuilderConfig) {
        this.ship = ship;
        this.config = config;
    }

    canPlaceBlock(position: { x: number; y: number }, blockType: string): boolean {
        const definition = BlockDefinitions.get(blockType);
        if (!definition) return false;

        return this.isPositionValid(position, definition);
    }

    placeBlock(position: { x: number; y: number }, blockType: string): boolean {
        const definition = BlockDefinitions.get(blockType);
        if (!definition) return false;

        if (!this.isPositionValid(position, definition)) {
            return false;
        }

        // Create and place the block
        const properties = BlockDefinitions.getDefaultProperties(blockType);
        const newBlock = new Block(definition, properties, position);

        this.ship.addBlock(newBlock, position);
        newBlock.container.x = position.x;
        newBlock.container.y = position.y;
        this.ship.container.addChild(newBlock.container);

        // Auto-connect to nearby blocks
        this.autoConnect(newBlock);

        return true;
    }

    removeBlock(position: { x: number; y: number }): boolean {
        // Find block at position and remove it
        for (const [id, block] of this.ship.blocks) {
            const blockPos = block.gridPosition;
            const definition = block.definition;

            // Check if position is within block bounds
            if (this.isPositionInBlock(position, blockPos, definition)) {
                this.ship.removeBlock(id);
                return true;
            }
        }
        return false;
    }

    public snapToGrid(position: Vector, blockDefinition?: any): Vector {
        if (!this.config.snapToGrid) return position;

        const { gridSize } = this.config;

        if (blockDefinition) {
            const blockWidth = blockDefinition.width || gridSize;
            const blockHeight = blockDefinition.height || gridSize;

            const gridUnitsX = blockWidth / gridSize;
            const gridUnitsY = blockHeight / gridSize;

            let snappedX = Math.round(position.x / gridSize) * gridSize;
            let snappedY = Math.round(position.y / gridSize) * gridSize;

            if (gridUnitsX > 1) {
                const offsetX = ((gridUnitsX - 1) * gridSize) / 2;
                snappedX = Math.round((position.x - offsetX) / gridSize) * gridSize + offsetX;
            }

            if (gridUnitsY > 1) {
                const offsetY = ((gridUnitsY - 1) * gridSize) / 2;
                snappedY = Math.round((position.y - offsetY) / gridSize) * gridSize + offsetY;
            }

            return { x: snappedX, y: snappedY };
        }

        return {
            x: Math.round(position.x / gridSize) * gridSize,
            y: Math.round(position.y / gridSize) * gridSize
        };
    }

    private isPositionValid(position: Vector, blockDefinition: any): boolean {
        return this.isPositionWithinBounds(position, blockDefinition) &&
            !this.isPositionOccupied(position, blockDefinition);
    }

    private isPositionWithinBounds(position: Vector, blockDefinition: any): boolean {
        const testWidth = blockDefinition.width || this.config.gridSize;
        const testHeight = blockDefinition.height || this.config.gridSize;

        const buildAreaHalfWidth = (this.config.gridWidth * this.config.gridSize) / 2;
        const buildAreaHalfHeight = (this.config.gridHeight * this.config.gridSize) / 2;

        const testLeft = position.x - testWidth / 2;
        const testRight = position.x + testWidth / 2;
        const testTop = position.y - testHeight / 2;
        const testBottom = position.y + testHeight / 2;

        const withinHorizontalBounds = testLeft >= -buildAreaHalfWidth && testRight <= buildAreaHalfWidth;
        const withinVerticalBounds = testTop >= -buildAreaHalfHeight && testBottom <= buildAreaHalfHeight;

        return withinHorizontalBounds && withinVerticalBounds;
    }

    private isPositionOccupied(position: Vector, blockDefinition: any): boolean {
        const testWidth = blockDefinition.width || this.config.gridSize;
        const testHeight = blockDefinition.height || this.config.gridSize;

        for (const block of this.ship.blocks.values()) {
            const blockPos = block.gridPosition;
            const existingDef = block.definition;
            const existingWidth = existingDef.width;
            const existingHeight = existingDef.height;

            const testLeft = position.x - testWidth / 2;
            const testRight = position.x + testWidth / 2;
            const testTop = position.y - testHeight / 2;
            const testBottom = position.y + testHeight / 2;

            const existingLeft = blockPos.x - existingWidth / 2;
            const existingRight = blockPos.x + existingWidth / 2;
            const existingTop = blockPos.y - existingHeight / 2;
            const existingBottom = blockPos.y + existingHeight / 2;

            const overlapping = !(testRight <= existingLeft ||
                testLeft >= existingRight ||
                testBottom <= existingTop ||
                testTop >= existingBottom);

            if (overlapping) {
                return true;
            }
        }
        return false;
    }

    private isPositionInBlock(position: Vector, blockPos: Vector, blockDefinition: any): boolean {
        const width = blockDefinition.width;
        const height = blockDefinition.height;

        const left = blockPos.x - width / 2;
        const right = blockPos.x + width / 2;
        const top = blockPos.y - height / 2;
        const bottom = blockPos.y + height / 2;

        return position.x >= left && position.x <= right &&
            position.y >= top && position.y <= bottom;
    }

    private autoConnect(newBlock: Block): void {
        const gridSize = this.config.gridSize;

        for (const existingBlock of this.ship.blocks.values()) {
            if (existingBlock === newBlock) continue;

            const newBlockPos = newBlock.gridPosition;
            const existingBlockPos = existingBlock.gridPosition;

            const newBlockDef = newBlock.definition;
            const existingBlockDef = existingBlock.definition;

            const newHalfWidth = newBlockDef.width / 2;
            const newHalfHeight = newBlockDef.height / 2;
            const existingHalfWidth = existingBlockDef.width / 2;
            const existingHalfHeight = existingBlockDef.height / 2;

            const deltaX = Math.abs(newBlockPos.x - existingBlockPos.x);
            const deltaY = Math.abs(newBlockPos.y - existingBlockPos.y);

            const expectedGapX = newHalfWidth + existingHalfWidth;
            const expectedGapY = newHalfHeight + existingHalfHeight;

            const tolerance = 2;

            const touchingHorizontally = (
                Math.abs(deltaX - expectedGapX) <= tolerance &&
                deltaY <= Math.max(newHalfHeight, existingHalfHeight) + tolerance
            );

            const touchingVertically = (
                Math.abs(deltaY - expectedGapY) <= tolerance &&
                deltaX <= Math.max(newHalfWidth, existingHalfWidth) + tolerance
            );

            if (touchingHorizontally || touchingVertically) {
                const newBlockPoints = newBlock.getAvailableConnectionPoints();
                const existingBlockPoints = existingBlock.getAvailableConnectionPoints();

                if (newBlockPoints.length > 0 && existingBlockPoints.length > 0) {
                    let bestDistance = Infinity;
                    let bestNewPoint = 0;
                    let bestExistingPoint = 0;

                    for (let i = 0; i < newBlockPoints.length; i++) {
                        for (let j = 0; j < existingBlockPoints.length; j++) {
                            const newPoint = newBlockDef.connectionPoints[newBlockPoints[i]];
                            const existingPoint = existingBlockDef.connectionPoints[existingBlockPoints[j]];

                            const newWorldPoint = {
                                x: newBlockPos.x + newPoint.x,
                                y: newBlockPos.y + newPoint.y
                            };
                            const existingWorldPoint = {
                                x: existingBlockPos.x + existingPoint.x,
                                y: existingBlockPos.y + existingPoint.y
                            };

                            const distance = Vector.magnitude(Vector.sub(newWorldPoint, existingWorldPoint));

                            if (distance < bestDistance) {
                                bestDistance = distance;
                                bestNewPoint = newBlockPoints[i];
                                bestExistingPoint = existingBlockPoints[j];
                            }
                        }
                    }

                    const connectionTolerance = gridSize;
                    if (bestDistance <= connectionTolerance) {
                        this.ship.connectBlocks(
                            newBlock,
                            existingBlock,
                            bestNewPoint,
                            bestExistingPoint
                        );
                    }
                }
            }
        }
    }
}

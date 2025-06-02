import { Container, Graphics } from 'pixi.js';
import { Ship } from '@/entities/Ship';
import { IShipBuilderConfig } from './interfaces/IUIComponent';
import { CameraController } from './components/CameraController';
import { InputHandler } from './components/InputHandler';
import { BlockPlacer } from './components/BlockPlacer';
import { BlockPreview } from './components/BlockPreview';
import { BlockDefinitions } from '@/entities/BlockDefinitions';
import { Vector } from 'matter-js';

export interface GridPosition {
    x: number;
    y: number;
}

export interface BuilderOptions {
    gridSize: number;
    gridWidth: number;
    gridHeight: number;
    snapToGrid: boolean;
    showGrid: boolean;
    showConnectionPoints: boolean;
    enableDebugVisualization?: boolean;
}

/**
 * Modern ShipBuilder following SOLID principles
 * - Single Responsibility: Each component handles one specific concern
 * - Open/Closed: Easy to extend with new components without modifying existing code
 * - Liskov Substitution: Components can be replaced with compatible implementations
 * - Interface Segregation: Components only depend on interfaces they need
 * - Dependency Inversion: Depends on abstractions, not concrete implementations
 */
export class ShipBuilder {
    private container: Container;
    private ship: Ship;
    private options: IShipBuilderConfig;
    private isBuilding: boolean = true;    // Core systems
    private worldContainer!: Container;
    private camera!: CameraController;
    private inputHandler!: InputHandler;
    private blockPlacer!: BlockPlacer;    // UI Components (only PIXI.js rendering components remain)
    private blockPreview!: BlockPreview;

    // Debug visualization components
    private debugContainer!: Container;
    private placeableAreaDebug!: Graphics;
    private cursorDebug!: Graphics;

    // Construction tape border for buildable area
    private constructionTapeBorder!: Graphics;

    // State
    private selectedBlockType: string | null = null;
    private lastMousePosition: Vector | null = null;

    // Callback for notifying external systems of changes
    private onShipChanged: (() => void) | null = null;
    private onBlockDeselected: (() => void) | null = null;

    constructor(container: Container, options: Partial<BuilderOptions> = {}) {
        this.container = container;
        this.ship = new Ship();

        this.options = {
            gridSize: 32,
            gridWidth: 40,
            gridHeight: 30,
            snapToGrid: true,
            showGrid: true,
            showConnectionPoints: true,
            enableDebugVisualization: false,
            ...options
        };

        this.initialize();
    } private initialize(): void {
        this.setupWorldContainer();
        this.setupCoreComponents();
        this.setupEventHandlers();
        this.setupDebugVisualization();

        // Start in pan mode since no block is selected initially
        this.inputHandler.setPanMode(true);

        // Initial resize to set up proper camera positioning
        this.resize(1600, 1000);
    } private setupWorldContainer(): void {
        this.worldContainer = new Container();
        this.container.addChild(this.worldContainer);

        // Add ship to world
        this.worldContainer.addChild(this.ship.container);

        // Setup debug visualization container - ADD TO MAIN CONTAINER, NOT WORLD CONTAINER
        // This way debug visuals don't get transformed by camera
        this.debugContainer = new Container();
        this.container.addChild(this.debugContainer);

        // Add permanent construction tape border for buildable area
        this.addConstructionTapeBorder();

        // Add placement area visualization if grid is hidden
        if (!this.options.showGrid) {
            this.addPlacementAreaVisualization();
        }
    } private setupCoreComponents(): void {
        // Initialize camera system
        this.camera = new CameraController(this.worldContainer);        // Set up camera transform callback to update debug visuals
        this.camera.setOnTransformChange(() => {
            this.updatePlaceableAreaDebug();
            this.updateConstructionTapeBorder();
        });

        // Initialize input handling
        this.inputHandler = new InputHandler(this.container, this.camera);

        // Initialize block placement system
        this.blockPlacer = new BlockPlacer(this.ship, this.options);

        // Initialize block preview
        this.blockPreview = new BlockPreview(this.worldContainer);

        // Apply initial camera transform now that everything is set up
        this.camera.updateTransform();
    } private setupEventHandlers(): void {
        // Input events
        this.inputHandler.on('mouseMove', (worldPos: Vector, screenPos: Vector) => {
            this.handleMouseMove(worldPos, screenPos);
        });

        this.inputHandler.on('leftClick', (worldPos: Vector, screenPos: Vector) => {
            this.handleLeftClick(worldPos, screenPos);
        });

        this.inputHandler.on('rightClick', (screenPos: Vector) => {
            this.handleRightClick(screenPos);
        });

        this.inputHandler.on('escapePressed', () => {
            this.deselectBlockType();
        });
    } private setupDebugVisualization(): void {
        // Always enable debug visualization for now to help debug the issue
        this.addDebugVisualization();
        this.addCursorDebug();

        // Add placeable area debug after a short delay to ensure camera is positioned
        setTimeout(() => {
            this.addPlaceableAreaDebug();
        }, 100);
    } public selectBlockType(blockType: string): void {
        this.selectedBlockType = blockType;
        this.blockPreview.showPreview(blockType);
        console.log(`Selected block type: ${blockType}`);

        // Exit pan mode when a block is selected
        this.inputHandler.setPanMode(false);

        // If we have a last mouse position, immediately update the preview position
        if (this.lastMousePosition && this.isBuilding) {
            const definition = BlockDefinitions.get(blockType);
            if (definition) {
                const finalPos = this.options.snapToGrid ?
                    this.blockPlacer.snapToGrid(this.lastMousePosition, definition) : this.lastMousePosition;

                const isValid = this.blockPlacer.canPlaceBlock(finalPos, blockType);
                const isWithinBounds = this.isPositionWithinBounds(finalPos, definition);
                const isOccupied = this.isPositionOccupied(finalPos, definition);

                this.blockPreview.updatePosition(finalPos.x, finalPos.y, isValid, isWithinBounds, isOccupied);
            }
        }
    }

    public deselectBlockType(): void {
        this.selectedBlockType = null;
        this.blockPreview.hidePreview();
        console.log('Block type deselected');

        // Enter pan mode when no block is selected
        this.inputHandler.setPanMode(true);

        // Notify external systems
        if (this.onBlockDeselected) {
            this.onBlockDeselected();
        }
    } private handleMouseMove(worldPos: Vector, _screenPos: Vector): void {
        // Track the last mouse position for when we switch block types
        this.lastMousePosition = worldPos;

        // Update cursor debug visualization
        this.updateCursorDebug(worldPos);

        // Enhanced debug logging to track the issue
        const debugInfo = {
            worldPos: { x: worldPos.x, y: worldPos.y },
            selectedBlockType: this.selectedBlockType,
            isBuilding: this.isBuilding,
            hasPreviewBlock: this.blockPreview.hasPreviewBlock(),
            gridConfig: {
                gridSize: this.options.gridSize,
                gridWidth: this.options.gridWidth,
                gridHeight: this.options.gridHeight
            },
            buildArea: {
                width: this.options.gridWidth * this.options.gridSize,
                height: this.options.gridHeight * this.options.gridSize,
                halfWidth: (this.options.gridWidth * this.options.gridSize) / 2,
                halfHeight: (this.options.gridHeight * this.options.gridSize) / 2
            }
        };

        if (!this.selectedBlockType || !this.isBuilding) {
            console.log('handleMouseMove: No block selected or not building', debugInfo);

            // Hide preview if no block is selected
            if (!this.selectedBlockType && this.blockPreview.hasPreviewBlock()) {
                console.log('handleMouseMove: Hiding preview because no block selected');
                this.blockPreview.hidePreview();
            }
            return;
        }

        const definition = BlockDefinitions.get(this.selectedBlockType);
        if (!definition) {
            console.log('handleMouseMove: No definition found for block type', this.selectedBlockType, debugInfo);
            return;
        }

        // Ensure we have a preview block - if not, recreate it
        if (!this.blockPreview.hasPreviewBlock()) {
            console.log('handleMouseMove: No preview block exists, recreating...', {
                selectedBlockType: this.selectedBlockType
            });
            this.blockPreview.showPreview(this.selectedBlockType);
        }

        // Apply grid snapping
        const finalPos = this.options.snapToGrid ?
            this.blockPlacer.snapToGrid(worldPos, definition) : worldPos;

        // Check position validity
        const isValid = this.blockPlacer.canPlaceBlock(finalPos, this.selectedBlockType);
        const isWithinBounds = this.isPositionWithinBounds(finalPos, definition);
        const isOccupied = this.isPositionOccupied(finalPos, definition);

        console.log('handleMouseMove: Position check', {
            ...debugInfo,
            definition: { width: definition.width, height: definition.height },
            finalPos: { x: finalPos.x, y: finalPos.y },
            isValid,
            isWithinBounds,
            isOccupied,
            boundsCheck: {
                testLeft: finalPos.x - definition.width / 2,
                testRight: finalPos.x + definition.width / 2,
                testTop: finalPos.y - definition.height / 2,
                testBottom: finalPos.y + definition.height / 2,
                buildAreaLeft: -debugInfo.buildArea.halfWidth,
                buildAreaRight: debugInfo.buildArea.halfWidth,
                buildAreaTop: -debugInfo.buildArea.halfHeight,
                buildAreaBottom: debugInfo.buildArea.halfHeight
            }
        });

        // Update preview
        this.blockPreview.updatePosition(finalPos.x, finalPos.y, isValid, isWithinBounds, isOccupied);
    } private handleLeftClick(worldPos: Vector, _screenPos: Vector): void {
        console.log('🖱️ handleLeftClick called', {
            worldPos: { x: worldPos.x, y: worldPos.y },
            selectedBlockType: this.selectedBlockType,
            isBuilding: this.isBuilding,
            hasPreviewBlock: this.blockPreview.hasPreviewBlock()
        });

        if (!this.selectedBlockType || !this.isBuilding) {
            // If clicking in building area without selection, potentially deselect
            if (this.selectedBlockType && this.isInBuildingArea(worldPos)) {
                this.deselectBlockType();
            }
            return;
        }

        const definition = BlockDefinitions.get(this.selectedBlockType)!;
        const finalPos = this.options.snapToGrid ?
            this.blockPlacer.snapToGrid(worldPos, definition) : worldPos;

        console.log('🎯 About to attempt block placement', {
            selectedBlockType: this.selectedBlockType,
            finalPos: { x: finalPos.x, y: finalPos.y },
            hasPreviewBlock: this.blockPreview.hasPreviewBlock(),
            shipBlockCount: this.ship.blocks.size
        });

        // Attempt to place block
        const success = this.blockPlacer.placeBlock(finalPos, this.selectedBlockType);

        if (success) {
            console.log(`✅ Block placed successfully at (${finalPos.x}, ${finalPos.y})`);
            console.log('📊 State before refresh:', {
                selectedBlockType: this.selectedBlockType,
                hasPreviewBlock: this.blockPreview.hasPreviewBlock(),
                shipBlockCount: this.ship.blocks.size
            });

            // Keep the block type selected for continuous building
            // Refresh the preview to ensure it continues working

            // Store the selected block type to ensure it doesn't get lost
            const currentBlockType = this.selectedBlockType;

            // Add a small delay to ensure any ongoing operations complete
            setTimeout(() => {
                console.log('🔄 Refreshing preview after placement', {
                    currentBlockType,
                    stillSelected: this.selectedBlockType === currentBlockType,
                    hasPreviewBlock: this.blockPreview.hasPreviewBlock()
                });

                if (this.selectedBlockType === currentBlockType) {
                    this.blockPreview.refreshPreview(currentBlockType);

                    // Force a position update if we have a last mouse position
                    if (this.lastMousePosition) {
                        console.log('🔄 Forcing position update with last mouse position');
                        this.handleMouseMove(this.lastMousePosition, { x: 0, y: 0 });
                    }
                }
            }, 10); // Very short delay to let any render cycles complete

            console.log('📊 State after refresh setup:', {
                selectedBlockType: this.selectedBlockType,
                hasPreviewBlock: this.blockPreview.hasPreviewBlock(),
                shipBlockCount: this.ship.blocks.size
            });

            // Trigger UI update - this will be handled by the adapter
            this.updateStats();
        } else {
            console.log(`❌ Cannot place block at (${finalPos.x}, ${finalPos.y})`);
        }
    }

    private handleRightClick(_screenPos: Vector): void {
        if (this.selectedBlockType) {
            this.deselectBlockType();
        }
    } private updateStats(): void {
        // Stats are now handled by MUI components through the adapter
        console.log('Ship stats updated (handled by MUI adapter)');

        // Notify external systems that ship has changed
        if (this.onShipChanged) {
            this.onShipChanged();
        }
    } public testShip(): void {
        const validation = this.ship.validateStructuralIntegrity();

        if (!validation.isValid) {
            console.warn('Cannot test ship: validation failed', validation.issues);
            return;
        }

        this.ship.createCompoundPhysicsBody();
        const shipComponent = this.ship.getComponent('ship') as any;
        if (shipComponent && shipComponent.setConstructed) {
            shipComponent.setConstructed(true);
        }

        console.log('Ship test mode activated!');
        console.log('Ship stats:', this.ship.calculateStats());
    }

    public repairConnections(): void {
        console.log('🔧 REPAIRING CONNECTIONS: Attempting to connect isolated blocks...');

        const validation = this.ship.validateStructuralIntegrity();
        if (validation.isValid) {
            console.log('✅ Ship structure is already valid - no repairs needed');
            return;
        }

        // Get the main connected structure
        const firstBlock = Array.from(this.ship.blocks.values())[0];
        const connectedBlocks = this.ship.getConnectedBlocks(firstBlock);
        const isolatedBlocks = Array.from(this.ship.blocks.values()).filter(block => !connectedBlocks.has(block));

        console.log(`Found ${isolatedBlocks.length} isolated blocks to reconnect`);

        let repairsSuccessful = 0;

        // Try to connect each isolated block to the main structure
        for (const isolatedBlock of isolatedBlocks) {
            let connected = false;

            // Try to connect to any block in the main structure
            for (const mainBlock of connectedBlocks) {
                if (connected) break;

                const isolatedPos = isolatedBlock.gridPosition;
                const mainPos = mainBlock.gridPosition;

                const distance = Vector.magnitude(Vector.sub(isolatedPos, mainPos));
                const maxConnectionDistance = this.options.gridSize * 2;

                if (distance <= maxConnectionDistance) {
                    const isolatedPoints = isolatedBlock.getAvailableConnectionPoints();
                    const mainPoints = mainBlock.getAvailableConnectionPoints();

                    if (isolatedPoints.length > 0 && mainPoints.length > 0) {
                        const success = this.ship.connectBlocks(
                            isolatedBlock,
                            mainBlock,
                            isolatedPoints[0],
                            mainPoints[0]
                        );

                        if (success) {
                            connected = true;
                            repairsSuccessful++;
                            console.log(`  ✅ Connected isolated block to main structure`);
                        }
                    }
                }
            }

            if (!connected) {
                console.log(`  ❌ Could not connect isolated block at (${isolatedBlock.gridPosition.x}, ${isolatedBlock.gridPosition.y})`);
            }
        }

        console.log(`🔧 REPAIR SUMMARY: ${repairsSuccessful} repairs successful`);
        this.updateStats();
    }

    public clearShip(): void {
        this.ship.destroy();
        this.ship = new Ship();
        this.worldContainer.addChild(this.ship.container);
        this.blockPlacer = new BlockPlacer(this.ship, this.options); // Update placer reference
        this.updateStats();
    }

    public getShip(): Ship {
        return this.ship;
    } public resize(screenWidth: number, screenHeight: number): void {
        this.container.width = screenWidth;
        this.container.height = screenHeight;

        // Initialize camera to center on first setup or when camera is at default position
        if (this.camera.x === 0 && this.camera.y === 0) {
            this.camera.initializePosition(screenWidth, screenHeight);
        }

        // Resize remaining PIXI.js components
        this.blockPreview.resize(screenWidth, screenHeight);

        // Update construction tape border
        this.updateConstructionTapeBorder();

        // Now that camera is properly positioned, add the placeable area debug
        if (!this.placeableAreaDebug) {
            this.addPlaceableAreaDebug();
        } else {
            this.updatePlaceableAreaDebug();
        }

        console.log(`UI resized for screen: ${screenWidth}x${screenHeight}`);
    } public destroy(): void {
        // Destroy remaining components
        this.ship.destroy();
        this.inputHandler.destroy();
        this.blockPreview.destroy();

        this.container.destroy({ children: true });
    }

    // Helper methods
    private isInBuildingArea(worldPos: Vector): boolean {
        const buildAreaHalfWidth = (this.options.gridWidth * this.options.gridSize) / 2;
        const buildAreaHalfHeight = (this.options.gridHeight * this.options.gridSize) / 2;

        return Math.abs(worldPos.x) <= buildAreaHalfWidth &&
            Math.abs(worldPos.y) <= buildAreaHalfHeight;
    }

    private isPositionWithinBounds(position: Vector, blockDefinition: any): boolean {
        const testWidth = blockDefinition.width || this.options.gridSize;
        const testHeight = blockDefinition.height || this.options.gridSize;

        const buildAreaHalfWidth = (this.options.gridWidth * this.options.gridSize) / 2;
        const buildAreaHalfHeight = (this.options.gridHeight * this.options.gridSize) / 2;

        const testLeft = position.x - testWidth / 2;
        const testRight = position.x + testWidth / 2;
        const testTop = position.y - testHeight / 2;
        const testBottom = position.y + testHeight / 2;

        const withinHorizontalBounds = testLeft >= -buildAreaHalfWidth && testRight <= buildAreaHalfWidth;
        const withinVerticalBounds = testTop >= -buildAreaHalfHeight && testBottom <= buildAreaHalfHeight;

        return withinHorizontalBounds && withinVerticalBounds;
    }

    private isPositionOccupied(position: Vector, blockDefinition: any): boolean {
        const testWidth = blockDefinition.width || this.options.gridSize;
        const testHeight = blockDefinition.height || this.options.gridSize;

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

    private addPlacementAreaVisualization(): void {
        const { gridSize, gridWidth, gridHeight } = this.options;
        const areaWidth = gridWidth * gridSize;
        const areaHeight = gridHeight * gridSize;
        const startX = -areaWidth / 2;
        const startY = -areaHeight / 2;

        const areaGraphics = new Graphics();
        areaGraphics.lineStyle(2, 0x3366CC, 0.4);

        // Draw dashed border
        const dashLength = 10;
        const gapLength = 5;

        // Draw all four edges with dashed lines
        this.drawDashedLine(areaGraphics, startX, startY, startX + areaWidth, startY, dashLength, gapLength); // Top
        this.drawDashedLine(areaGraphics, startX + areaWidth, startY, startX + areaWidth, startY + areaHeight, dashLength, gapLength); // Right
        this.drawDashedLine(areaGraphics, startX + areaWidth, startY + areaHeight, startX, startY + areaHeight, dashLength, gapLength); // Bottom
        this.drawDashedLine(areaGraphics, startX, startY + areaHeight, startX, startY, dashLength, gapLength); // Left

        // Add corner indicators
        const cornerSize = 20;
        areaGraphics.lineStyle(3, 0x3366CC, 0.6);

        // Draw corners
        this.drawCorner(areaGraphics, startX, startY, cornerSize, 'top-left');
        this.drawCorner(areaGraphics, startX + areaWidth, startY, cornerSize, 'top-right');
        this.drawCorner(areaGraphics, startX + areaWidth, startY + areaHeight, cornerSize, 'bottom-right');
        this.drawCorner(areaGraphics, startX, startY + areaHeight, cornerSize, 'bottom-left');

        // Add subtle fill
        areaGraphics.beginFill(0x3366CC, 0.03);
        areaGraphics.drawRect(startX, startY, areaWidth, areaHeight);
        areaGraphics.endFill();

        this.worldContainer.addChild(areaGraphics);
    }

    private drawDashedLine(graphics: Graphics, x1: number, y1: number, x2: number, y2: number, dashLength: number, gapLength: number): void {
        const totalLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const dashTotal = dashLength + gapLength;

        let currentDistance = 0;

        while (currentDistance < totalLength) {
            const isDash = (currentDistance % dashTotal) < dashLength;
            const segmentLength = Math.min(dashLength, totalLength - currentDistance);

            if (isDash) {
                const startX = x1 + Math.cos(angle) * currentDistance;
                const startY = y1 + Math.sin(angle) * currentDistance;
                const endX = x1 + Math.cos(angle) * (currentDistance + segmentLength);
                const endY = y1 + Math.sin(angle) * (currentDistance + segmentLength);

                graphics.moveTo(startX, startY);
                graphics.lineTo(endX, endY);
            }

            currentDistance += dashTotal;
        }
    }

    private drawCorner(graphics: Graphics, x: number, y: number, size: number, corner: string): void {
        switch (corner) {
            case 'top-left':
                graphics.moveTo(x, y + size);
                graphics.lineTo(x, y);
                graphics.lineTo(x + size, y);
                break;
            case 'top-right':
                graphics.moveTo(x - size, y);
                graphics.lineTo(x, y);
                graphics.lineTo(x, y + size);
                break;
            case 'bottom-right':
                graphics.moveTo(x, y - size);
                graphics.lineTo(x, y);
                graphics.lineTo(x - size, y);
                break; case 'bottom-left':
                graphics.moveTo(x + size, y);
                graphics.lineTo(x, y);
                graphics.lineTo(x, y - size);
                break;
        }
    }

    private addConstructionTapeBorder(): void {
        this.constructionTapeBorder = new Graphics();
        this.worldContainer.addChild(this.constructionTapeBorder);
        this.updateConstructionTapeBorder();
    } private updateConstructionTapeBorder(): void {
        if (!this.constructionTapeBorder) return;

        this.constructionTapeBorder.clear();

        const { gridSize, gridWidth, gridHeight } = this.options;
        const areaWidth = gridWidth * gridSize;
        const areaHeight = gridHeight * gridSize;
        const startX = -areaWidth / 2;
        const startY = -areaHeight / 2;

        // Construction tape style: thick border with alternating black and yellow diagonal stripes
        const borderThickness = 12;
        const stripeWidth = 16;

        // First, draw the yellow background for the border area
        this.constructionTapeBorder.lineStyle(borderThickness, 0xFFD700, 1.0); // Gold yellow
        this.constructionTapeBorder.drawRect(startX, startY, areaWidth, areaHeight);

        // Then draw black diagonal stripes over the yellow
        this.drawConstructionTapeStripes(
            this.constructionTapeBorder,
            startX, startY, areaWidth, areaHeight,
            borderThickness, stripeWidth
        );
    } private drawConstructionTapeStripes(
        graphics: Graphics,
        x: number, y: number,
        width: number, height: number,
        borderThickness: number,
        stripeWidth: number
    ): void {
        // Draw black diagonal stripes over the yellow background
        const stripeSpacing = stripeWidth * 1.5;

        // Set up for diagonal stripes
        graphics.lineStyle(3, 0x000000, 0.9);

        // Draw diagonal stripes on top border
        this.drawBorderStripes(graphics, x, y, width, borderThickness, stripeSpacing, 'horizontal');

        // Draw diagonal stripes on bottom border
        this.drawBorderStripes(graphics, x, y + height - borderThickness, width, borderThickness, stripeSpacing, 'horizontal');

        // Draw diagonal stripes on left border
        this.drawBorderStripes(graphics, x, y, borderThickness, height, stripeSpacing, 'vertical');

        // Draw diagonal stripes on right border
        this.drawBorderStripes(graphics, x + width - borderThickness, y, borderThickness, height, stripeSpacing, 'vertical');
    }

    private drawBorderStripes(
        graphics: Graphics,
        x: number, y: number,
        width: number, height: number,
        stripeSpacing: number,
        orientation: 'horizontal' | 'vertical'
    ): void {
        if (orientation === 'horizontal') {
            // Horizontal border with diagonal stripes
            for (let i = 0; i < width + height; i += stripeSpacing) {
                const startX = x + i;
                const endX = startX + stripeSpacing * 0.6;
                const startY = y;
                const endY = y + height;

                if (startX < x + width) {
                    graphics.moveTo(Math.max(x, startX), startY);
                    graphics.lineTo(Math.min(x + width, endX), endY);
                }
            }
        } else {
            // Vertical border with diagonal stripes
            for (let i = 0; i < width + height; i += stripeSpacing) {
                const startY = y + i;
                const endY = startY + stripeSpacing * 0.6;
                const startX = x;
                const endX = x + width;

                if (startY < y + height) {
                    graphics.moveTo(startX, Math.max(y, startY));
                    graphics.lineTo(endX, Math.min(y + height, endY));
                }
            }
        }
    }

    // Public API methods for testing and external use
    public testConnectionSystem(): void {
        console.log('🧪 TESTING CONNECTION SYSTEM:');
        this.clearShip();

        // Helper function to place a block programmatically
        const placeTestBlock = (x: number, y: number, blockType: string) => {
            return this.blockPlacer.placeBlock({ x, y }, blockType);
        };

        // Place test blocks in a pattern
        placeTestBlock(0, 0, 'hull_basic');
        placeTestBlock(32, 0, 'hull_basic');
        placeTestBlock(-32, 0, 'hull_basic');
        placeTestBlock(0, -32, 'weapon_laser');
        placeTestBlock(0, 32, 'engine_basic');

        const validation = this.ship.validateStructuralIntegrity();
        console.log('🧪 TEST RESULTS:');
        console.log(`  Ship is valid: ${validation.isValid}`);
        console.log(`  Total blocks: ${this.ship.blocks.size}`);

        if (!validation.isValid) {
            console.log('  Issues found:', validation.issues);
            console.log('  Attempting auto-repair...');
            this.repairConnections();
        } else {
            console.log('  ✅ All blocks properly connected!');
        }

        this.updateStats();
    }

    public saveShip(): any {
        // Serialize ship data
        const shipData = {
            blocks: Array.from(this.ship.blocks.values()).map(block => ({
                id: block.id,
                type: block.definition.type,
                position: block.gridPosition,
                rotation: block.rotation
            })),
            connections: this.ship.constraints.map(() => ({
                // Store constraint data - would need to implement
            }))
        };

        return shipData;
    } public loadShip(_shipData: any): void {
        this.clearShip();
        // Reconstruct ship from data - would need to implement
    }    // Additional public methods for adapter integration

    public getSelectedBlockType(): string | null {
        return this.selectedBlockType;
    }

    public getCamera(): CameraController {
        return this.camera;
    }

    public setBuildingMode(isBuilding: boolean): void {
        this.isBuilding = isBuilding;
    }

    public isBuildingMode(): boolean {
        return this.isBuilding;
    }

    public toggleGrid(): void {
        this.options.showGrid = !this.options.showGrid;
        // Implementation would need to update grid visibility
        console.log(`Grid toggled: ${this.options.showGrid ? 'enabled' : 'disabled'}`);
    } public toggleConnectionPoints(): void {
        this.options.showConnectionPoints = !this.options.showConnectionPoints;
        // Implementation would need to update connection point visibility
        console.log(`Connection points toggled: ${this.options.showConnectionPoints ? 'enabled' : 'disabled'}`);
    }    // Camera control methods for adapter integration
    public zoomIn(): void {
        this.camera.zoomTo(0.1);
    }

    public zoomOut(): void {
        this.camera.zoomTo(-0.1);
    }

    public centerOnShip(): void {
        if (this.ship.blocks.size === 0) return;

        // Calculate ship bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        for (const block of this.ship.blocks.values()) {
            const pos = block.gridPosition;
            const def = block.definition;
            const halfWidth = def.width / 2;
            const halfHeight = def.height / 2;

            minX = Math.min(minX, pos.x - halfWidth);
            maxX = Math.max(maxX, pos.x + halfWidth);
            minY = Math.min(minY, pos.y - halfHeight);
            maxY = Math.max(maxY, pos.y + halfHeight);
        }

        // Center camera on ship bounds
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Use pan to move camera to center position
        this.camera.pan(-centerX - this.camera.x, -centerY - this.camera.y);
    }

    public resetZoom(): void {
        this.camera.reset();
    }

    // Additional methods for ShipBuilderAdapter compatibility
    public setShowGrid(show: boolean): void {
        this.options.showGrid = show;
        console.log(`Grid visibility set to: ${show ? 'enabled' : 'disabled'}`);
    }

    public getShowGrid(): boolean {
        return this.options.showGrid;
    }

    public setShowConnectionPoints(show: boolean): void {
        this.options.showConnectionPoints = show;
        console.log(`Connection points visibility set to: ${show ? 'enabled' : 'disabled'}`);
    }

    public getShowConnectionPoints(): boolean {
        return this.options.showConnectionPoints;
    }

    public setSnapToGrid(snap: boolean): void {
        this.options.snapToGrid = snap;
        console.log(`Snap to grid set to: ${snap ? 'enabled' : 'disabled'}`);
    }

    public getSnapToGrid(): boolean {
        return this.options.snapToGrid;
    } public getZoom(): number {
        return this.camera.zoom;
    } public setZoom(zoom: number): void {
        const currentZoom = this.camera.zoom;
        const deltaZoom = zoom - currentZoom;
        this.camera.zoomTo(deltaZoom);
    }

    public resetCamera(): void {
        this.camera.reset();
    }

    public setDebugVisualization(enabled: boolean): void {
        this.options.enableDebugVisualization = enabled;
        console.log(`Debug visualization set to: ${enabled ? 'enabled' : 'disabled'}`);
    }

    public getDebugVisualization(): boolean {
        return this.options.enableDebugVisualization || false;
    }

    // Callback setter methods for external integration
    public setOnShipChanged(callback: (() => void) | null): void {
        this.onShipChanged = callback;
    } public setOnBlockDeselected(callback: (() => void) | null): void {
        this.onBlockDeselected = callback;
    }    // Debug visualization methods
    private addDebugVisualization(): void {
        this.placeableAreaDebug = new Graphics();
        this.debugContainer.addChild(this.placeableAreaDebug);
    }

    private addCursorDebug(): void {
        this.cursorDebug = new Graphics();
        this.debugContainer.addChild(this.cursorDebug);
    }

    private addPlaceableAreaDebug(): void {
        if (!this.placeableAreaDebug) return;

        this.placeableAreaDebug.clear();

        const { gridSize, gridWidth, gridHeight } = this.options;
        const areaWidth = gridWidth * gridSize;
        const areaHeight = gridHeight * gridSize;

        // Convert world bounds to screen coordinates
        const worldTopLeft = { x: -areaWidth / 2, y: -areaHeight / 2 };
        const worldBottomRight = { x: areaWidth / 2, y: areaHeight / 2 };

        const screenTopLeft = this.camera.worldToScreen(worldTopLeft);
        const screenBottomRight = this.camera.worldToScreen(worldBottomRight);

        const screenWidth = screenBottomRight.x - screenTopLeft.x;
        const screenHeight = screenBottomRight.y - screenTopLeft.y;

        // Draw bright colored rectangle for placeable area in screen space
        this.placeableAreaDebug.lineStyle(3, 0x00FF00, 1.0); // Bright green
        this.placeableAreaDebug.drawRect(screenTopLeft.x, screenTopLeft.y, screenWidth, screenHeight);

        // Add semi-transparent fill
        this.placeableAreaDebug.beginFill(0x00FF00, 0.1);
        this.placeableAreaDebug.drawRect(screenTopLeft.x, screenTopLeft.y, screenWidth, screenHeight);
        this.placeableAreaDebug.endFill();

        console.log(`🔧 DEBUG PLACEABLE AREA:`);
        console.log(`📐 Camera position: (${this.camera.x}, ${this.camera.y}) zoom: ${this.camera.zoom}`);
        console.log(`📏 Grid config: ${gridWidth}x${gridHeight} @ ${gridSize}px = ${areaWidth}x${areaHeight}px`);
        console.log(`🌍 World bounds: (${worldTopLeft.x}, ${worldTopLeft.y}) to (${worldBottomRight.x}, ${worldBottomRight.y})`);
        console.log(`🖥️ Screen bounds: (${screenTopLeft.x}, ${screenTopLeft.y}) to (${screenBottomRight.x}, ${screenBottomRight.y})`);
    }

    private updateCursorDebug(worldPos: Vector): void {
        if (!this.cursorDebug) return;

        this.cursorDebug.clear();

        // Convert world position to screen position for cursor debug
        const screenPos = this.camera.worldToScreen({ x: worldPos.x, y: worldPos.y });

        // Draw a cross at cursor position IN SCREEN SPACE
        const crossSize = 20;
        this.cursorDebug.lineStyle(2, 0xFF0000, 1.0); // Bright red

        // Horizontal line
        this.cursorDebug.moveTo(screenPos.x - crossSize, screenPos.y);
        this.cursorDebug.lineTo(screenPos.x + crossSize, screenPos.y);

        // Vertical line
        this.cursorDebug.moveTo(screenPos.x, screenPos.y - crossSize);
        this.cursorDebug.lineTo(screenPos.x, screenPos.y + crossSize);

        // Add small circle at center
        this.cursorDebug.beginFill(0xFF0000, 0.8);
        this.cursorDebug.drawCircle(screenPos.x, screenPos.y, 3);
        this.cursorDebug.endFill();
    }

    private updatePlaceableAreaDebug(): void {
        if (!this.placeableAreaDebug) return;

        this.placeableAreaDebug.clear();

        const { gridSize, gridWidth, gridHeight } = this.options;
        const areaWidth = gridWidth * gridSize;
        const areaHeight = gridHeight * gridSize;

        // Convert world bounds to screen coordinates
        const worldTopLeft = { x: -areaWidth / 2, y: -areaHeight / 2 };
        const worldBottomRight = { x: areaWidth / 2, y: areaHeight / 2 };

        const screenTopLeft = this.camera.worldToScreen(worldTopLeft);
        const screenBottomRight = this.camera.worldToScreen(worldBottomRight);

        const screenWidth = screenBottomRight.x - screenTopLeft.x;
        const screenHeight = screenBottomRight.y - screenTopLeft.y;

        // Draw bright colored rectangle for placeable area in screen space
        this.placeableAreaDebug.lineStyle(3, 0x00FF00, 1.0); // Bright green
        this.placeableAreaDebug.drawRect(screenTopLeft.x, screenTopLeft.y, screenWidth, screenHeight);

        // Add semi-transparent fill
        this.placeableAreaDebug.beginFill(0x00FF00, 0.1);
        this.placeableAreaDebug.drawRect(screenTopLeft.x, screenTopLeft.y, screenWidth, screenHeight);
        this.placeableAreaDebug.endFill();
    }

    // Debug method to track system state
    public debugSystemState(): void {
        console.log('🔍 SHIP BUILDER SYSTEM STATE:');
        console.log('- Selected block type:', this.selectedBlockType);
        console.log('- Is building mode:', this.isBuilding);
        console.log('- Has preview block:', this.blockPreview.hasPreviewBlock());
        console.log('- Ship has blocks:', this.ship.blocks.size);
        console.log('- Pan mode:', this.inputHandler.getPanMode());
        console.log('- Last mouse position:', this.lastMousePosition);
        console.log('- Camera position:', { x: this.camera.x, y: this.camera.y, zoom: this.camera.zoom });
        console.log('- Grid config:', {
            gridSize: this.options.gridSize,
            gridWidth: this.options.gridWidth,
            gridHeight: this.options.gridHeight,
            buildArea: {
                width: this.options.gridWidth * this.options.gridSize,
                height: this.options.gridHeight * this.options.gridSize
            }
        });
    }

    // Debug methods to allow testing (expose private methods for debugging)
    public testHandleMouseMove(worldPos: Vector, screenPos: Vector): void {
        this.handleMouseMove(worldPos, screenPos);
    }

    public testHandleLeftClick(worldPos: Vector, screenPos: Vector): void {
        this.handleLeftClick(worldPos, screenPos);
    }

    public testIsPositionWithinBounds(position: Vector, blockDefinition: any): boolean {
        return this.isPositionWithinBounds(position, blockDefinition);
    }
}

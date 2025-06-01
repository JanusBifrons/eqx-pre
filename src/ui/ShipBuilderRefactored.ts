import { Container, Graphics } from 'pixi.js';
import { Ship } from '@/entities/Ship';
import { IShipBuilderConfig } from './interfaces/IUIComponent';
import { CameraController } from './components/CameraController';
import { BlockPalette } from './components/BlockPalette';
import { StatsPanel } from './components/StatsPanel';
import { ActionButtons, ActionButton } from './components/ActionButtons';
import { InstructionsPanel } from './components/InstructionsPanel';
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
 * Refactored ShipBuilder following SOLID principles
 * - Single Responsibility: Each component handles one specific concern
 * - Open/Closed: Easy to extend with new components without modifying existing code
 * - Liskov Substitution: Components can be replaced with compatible implementations
 * - Interface Segregation: Components only depend on interfaces they need
 * - Dependency Inversion: Depends on abstractions, not concrete implementations
 */
export class ShipBuilderRefactored {
    private container: Container;
    private ship: Ship;
    private options: IShipBuilderConfig;
    private isBuilding: boolean = true;    // Core systems
    private worldContainer!: Container;
    private camera!: CameraController;
    private inputHandler!: InputHandler;
    private blockPlacer!: BlockPlacer;

    // UI Components
    private blockPalette!: BlockPalette;
    private statsPanel!: StatsPanel;
    private actionButtons!: ActionButtons;
    private instructionsPanel!: InstructionsPanel;
    private blockPreview!: BlockPreview;

    // State
    private selectedBlockType: string | null = null;

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
    }

    private initialize(): void {
        this.setupWorldContainer();
        this.setupCoreComponents();
        this.setupUIComponents();
        this.setupEventHandlers();
        this.setupDebugVisualization();

        // Initial resize
        this.resize(1600, 1000);
    }

    private setupWorldContainer(): void {
        this.worldContainer = new Container();
        this.container.addChild(this.worldContainer);

        // Add ship to world
        this.worldContainer.addChild(this.ship.container);

        // Add placement area visualization if grid is hidden
        if (!this.options.showGrid) {
            this.addPlacementAreaVisualization();
        }
    }

    private setupCoreComponents(): void {
        // Initialize camera system
        this.camera = new CameraController(this.worldContainer);

        // Initialize input handling
        this.inputHandler = new InputHandler(this.container, this.camera);

        // Initialize block placement system
        this.blockPlacer = new BlockPlacer(this.ship, this.options);

        // Initialize block preview
        this.blockPreview = new BlockPreview(this.worldContainer);
    }

    private setupUIComponents(): void {
        // Create UI components
        this.blockPalette = new BlockPalette();
        this.statsPanel = new StatsPanel();
        this.actionButtons = new ActionButtons();
        this.instructionsPanel = new InstructionsPanel();

        // Add to container with proper z-indexing
        this.container.addChild(this.statsPanel.getContainer());
        this.container.addChild(this.instructionsPanel.getContainer());
        this.container.addChild(this.blockPalette.getContainer());
        this.container.addChild(this.actionButtons.getContainer());

        // Setup action buttons
        this.setupActionButtons();

        // Enable z-index sorting
        this.container.sortableChildren = true;
        this.statsPanel.getContainer().zIndex = 10;
        this.instructionsPanel.getContainer().zIndex = 20;
        this.blockPalette.getContainer().zIndex = 100;
        this.actionButtons.getContainer().zIndex = 15;

        // Update initial stats
        this.updateStats();
    }

    private setupActionButtons(): void {
        const buttons: ActionButton[] = [
            {
                label: 'Clear Ship',
                color: 0xFF4444,
                borderColor: 0xFF6666,
                textColor: 0xFFFFFF,
                action: () => this.clearShip()
            },
            {
                label: 'Test Ship',
                color: 0x44FF44,
                borderColor: 0x66FF66,
                textColor: 0x000000,
                action: () => this.testShip()
            },
            {
                label: 'Repair Links',
                color: 0xFFAA00,
                borderColor: 0xFFCC44,
                textColor: 0x000000,
                action: () => this.repairConnections()
            }
        ];

        buttons.forEach(button => this.actionButtons.addButton(button));
    }

    private setupEventHandlers(): void {
        // Block palette events
        this.blockPalette.on('blockSelected', (blockType: string) => {
            this.selectBlockType(blockType);
        });

        this.blockPalette.on('blockDeselected', () => {
            this.deselectBlockType();
        });

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
    }

    private setupDebugVisualization(): void {
        if (this.options.enableDebugVisualization) {
            this.addDebugVisualization();
        }
    }

    private selectBlockType(blockType: string): void {
        this.selectedBlockType = blockType;
        this.blockPreview.showPreview(blockType);
        console.log(`Selected block type: ${blockType}`);
    }

    private deselectBlockType(): void {
        this.selectedBlockType = null;
        this.blockPalette.deselectBlock();
        this.blockPreview.hidePreview();
        console.log('Block type deselected');
    }

    private handleMouseMove(worldPos: Vector, _screenPos: Vector): void {
        if (!this.selectedBlockType || !this.isBuilding) return;

        const definition = BlockDefinitions.get(this.selectedBlockType);
        if (!definition) return;

        // Apply grid snapping
        const finalPos = this.options.snapToGrid ?
            this.blockPlacer.snapToGrid(worldPos, definition) : worldPos;

        // Check position validity
        const isValid = this.blockPlacer.canPlaceBlock(finalPos, this.selectedBlockType);
        const isWithinBounds = this.isPositionWithinBounds(finalPos, definition);
        const isOccupied = this.isPositionOccupied(finalPos, definition);

        // Update preview
        this.blockPreview.updatePosition(finalPos.x, finalPos.y, isValid, isWithinBounds, isOccupied);
    }

    private handleLeftClick(worldPos: Vector, _screenPos: Vector): void {
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

        // Attempt to place block
        const success = this.blockPlacer.placeBlock(finalPos, this.selectedBlockType);

        if (success) {
            console.log(`Block placed at (${finalPos.x}, ${finalPos.y})`);
            this.updateStats();
            this.blockPreview.showPreview(this.selectedBlockType); // Recreate preview
        } else {
            console.log(`Cannot place block at (${finalPos.x}, ${finalPos.y})`);
        }
    }

    private handleRightClick(_screenPos: Vector): void {
        if (this.selectedBlockType) {
            this.deselectBlockType();
        }
    }

    private updateStats(): void {
        this.statsPanel.updateStats(this.ship);
    }

    private testShip(): void {
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
    }

    public resize(screenWidth: number, screenHeight: number): void {
        this.container.width = screenWidth;
        this.container.height = screenHeight;

        // Resize all UI components
        this.blockPalette.resize(screenWidth, screenHeight);
        this.statsPanel.resize(screenWidth, screenHeight);
        this.actionButtons.resize(screenWidth, screenHeight);
        this.instructionsPanel.resize(screenWidth, screenHeight);
        this.blockPreview.resize(screenWidth, screenHeight);

        console.log(`UI resized for screen: ${screenWidth}x${screenHeight}`);
    }

    public destroy(): void {
        // Destroy all components
        this.ship.destroy();
        this.blockPalette.destroy();
        this.statsPanel.destroy();
        this.actionButtons.destroy();
        this.instructionsPanel.destroy();
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
                break;
            case 'bottom-left':
                graphics.moveTo(x + size, y);
                graphics.lineTo(x, y);
                graphics.lineTo(x, y - size);
                break;
        }
    }

    private addDebugVisualization(): void {
        const debugGraphics = new Graphics();
        debugGraphics.lineStyle(2, 0xFF0000, 0.5);
        debugGraphics.drawRect(-800, -500, 1600, 1000);

        // Draw center crosshairs
        debugGraphics.moveTo(-50, 0);
        debugGraphics.lineTo(50, 0);
        debugGraphics.moveTo(0, -50);
        debugGraphics.lineTo(0, 50);

        this.container.addChild(debugGraphics);
        console.log('🔍 Debug visualization added - red border shows screen bounds');
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
    }

    public loadShip(_shipData: any): void {
        this.clearShip();
        // Reconstruct ship from data - would need to implement
    }
}
